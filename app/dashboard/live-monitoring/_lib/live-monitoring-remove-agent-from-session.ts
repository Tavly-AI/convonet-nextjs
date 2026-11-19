"use server"

import { ParticipantInfo_Kind } from "@livekit/protocol"
import { RoomServiceClient, ServerError } from "livekit-server-sdk"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getAuthorizedCall(callId: string) {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")

    if (typeof callId !== "string" || !callId.trim()) throw new Error("A valid call ID is required")

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
    if (!user?.workspaceId) throw new Error("Workspace not found")

    const call = await prisma.callRecord.findFirst({
        where: { call_id: callId.trim(), workspaceId: user.workspaceId, channel: "voice" },
        select: { call_id: true, call_status: true },
    })

    if (!call) throw new Error("Call not found")

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!url || !apiKey || !apiSecret) throw new Error("LiveKit is not configured")

    return { call, livekit: new RoomServiceClient(url, apiKey, apiSecret) }
}

// Prerequisite: the agent runtime must not delete the room when removed.
export async function live_monitoring_removeAgentFromSession(callId: string) {
    const { call, livekit } = await getAuthorizedCall(callId)
    if (call.call_status !== "ongoing") throw new Error("Ongoing call not found")

    try {
        const participants = await livekit.listParticipants(call.call_id)
        const agents = participants.filter(participant => participant.kind === ParticipantInfo_Kind.AGENT)

        for (const agent of agents) {
            await livekit.removeParticipant(call.call_id, agent.identity)
        }

        return { success: true, removedCount: agents.length }
    } catch (error) {
        console.error("Failed to remove LiveKit agent:", error)
        throw new Error("Unable to confirm AI disconnection. The AI may still be connected.")
    }
}

export async function live_monitoring_endCall(callId: string) {
    const { call, livekit } = await getAuthorizedCall(callId)

    try {
        await livekit.deleteRoom(call.call_id)
    } catch (error) {
        if (!(error instanceof ServerError && error.code === "not_found")) {
            console.error("Failed to end LiveKit call:", error)
            throw new Error("Unable to end the call. Please try again.")
        }
    }

    return { success: true }
}
