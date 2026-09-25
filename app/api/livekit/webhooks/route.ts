import { DisconnectReason, ParticipantInfo_Kind } from "@livekit/protocol"
import { NextResponse } from "next/server"
import { type WebhookEvent, WebhookReceiver } from "livekit-server-sdk"

import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(request: Request) {
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: "LiveKit is not configured" }, { status: 500 })
    }

    try {
        const event = await new WebhookReceiver(apiKey, apiSecret).receive(await request.text(), request.headers.get("authorization") ?? undefined)

        const callStatus = deriveCallStatus(event)
        const disconnectReason = deriveDisconnectReason(event)

        if ((callStatus || disconnectReason) && event.room?.name) {
            await prisma.callRecord.updateMany({
                where: {
                    call_id: event.room.name,
                    call_status: { in: ["registered", "ongoing"] },
                },
                data: {
                    ...(callStatus && { call_status: callStatus }),
                    ...(disconnectReason && { disconnection_reason: disconnectReason }),
                },
            })
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.warn("LiveKit webhook failed", error instanceof Error ? error.message : error)
        return NextResponse.json({ error: "Invalid LiveKit webhook" }, { status: 401 })
    }
}

function deriveCallStatus(event: WebhookEvent): NonNullable<CallRecordDatabaseData["call_status"]> | null {

    // https://docs.livekit.io/intro/basics/rooms-participants-tracks/webhooks-events/#webhook-events
    if (event.event === "room_started") return "ongoing"
    if (event.event === "participant_connection_aborted") return "error"
    if (event.event === "room_finished") return "ended"

    if (event.event !== "participant_left" || event.participant?.kind !== ParticipantInfo_Kind.SIP) return null

    if ([DisconnectReason.USER_UNAVAILABLE, DisconnectReason.USER_REJECTED].includes(event.participant.disconnectReason)) { return "not_connected" }

    return event.participant.disconnectReason === DisconnectReason.SIP_TRUNK_FAILURE ? "error" : null
}

// https://github.com/livekit/node-sdks/blob/7af545433d9b923eb496da4274f65e122d44ef40/packages/livekit-rtc/src/participant.ts#L131
function deriveDisconnectReason(event: WebhookEvent): NonNullable<CallRecordDatabaseData["disconnection_reason"]> | null {
    if (event.event !== "participant_left" || !event.participant) return null

    switch (event.participant.disconnectReason) {
        case DisconnectReason.CLIENT_INITIATED:
            return event.participant.kind === ParticipantInfo_Kind.AGENT ? "agent_hangup" : "user_hangup"
        case DisconnectReason.USER_UNAVAILABLE:
            return "dial_no_answer"
        case DisconnectReason.USER_REJECTED:
            return "dial_busy"
        case DisconnectReason.SIP_TRUNK_FAILURE:
            return "telephony_provider_unavailable"
        case DisconnectReason.JOIN_FAILURE:
            return "error_user_not_joined"
        case DisconnectReason.CONNECTION_TIMEOUT:
            return "registered_call_timeout"
        case DisconnectReason.MEDIA_FAILURE:
            return "error_no_audio_received"
        case DisconnectReason.AGENT_ERROR:
            return "error_retell"
        case DisconnectReason.PARTICIPANT_REMOVED:
        case DisconnectReason.ROOM_DELETED:
            return "manual_stopped"
        case DisconnectReason.ROOM_CLOSED:
            return event.participant.kind === ParticipantInfo_Kind.AGENT ? null : "user_hangup"
        case DisconnectReason.MIGRATION:
            return null
        default:
            return "error_unknown"
    }
}
