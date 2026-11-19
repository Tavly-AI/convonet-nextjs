import { randomUUID } from "crypto"
import { AccessToken, TrackSource } from "livekit-server-sdk"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const createTokenSchema = z.object({
    callId: z.string().trim().min(1, "callId is required"),
})

export async function POST(request: Request) {
    const userId = await getCurrentUserId()
    if (!userId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

    let input: z.infer<typeof createTokenSchema>
    try {
        input = createTokenSchema.parse(await request.json())
    } catch {
        return NextResponse.json({ error: "callId is required" }, { status: 400 })
    }

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    if (!url || !apiKey || !apiSecret) { return NextResponse.json({ error: "LiveKit is not configured" }, { status: 500 }) }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { workspaceId: true },
        })
        if (!user?.workspaceId) { return NextResponse.json({ error: "Workspace not found" }, { status: 404 }) }

        const call = await prisma.callRecord.findFirst({
            where: { call_id: input.callId, workspaceId: user.workspaceId, channel: "voice", call_status: "ongoing" },
            select: { call_id: true },
        })
        if (!call) { return NextResponse.json({ error: "Ongoing call not found" }, { status: 404 }) }

        const identity = `monitor-${randomUUID()}`
        const token = new AccessToken(apiKey, apiSecret, { identity, ttl: "10m" })

        token.addGrant({
            room: call.call_id,
            roomJoin: true,
            canSubscribe: true,
            canPublish: true,
            canPublishSources: [TrackSource.MICROPHONE],
            canPublishData: false,
            hidden: true,
        })

        return NextResponse.json({
            token: await token.toJwt(),
            url,
            roomName: call.call_id,
            identity,
        })
    } catch {
        return NextResponse.json({ error: "Failed to create LiveKit monitoring token" }, { status: 500 })
    }
}
