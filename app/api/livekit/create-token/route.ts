import { AccessToken, LiveKitAPI } from "livekit-server-sdk"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUserId } from "@/lib/auth"
import { randomUUID } from "crypto"

export const runtime = "nodejs"

const createTokenSchema = z.object({
    agentId: z.string().trim().min(1, "agentId is required"),
})

const VOICE_RUNTIME_AGENT_NAME = "my-agent-123123"

export async function POST(request: Request) {
    const userId = await getCurrentUserId()
    if (!userId) { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

    let input: z.infer<typeof createTokenSchema>

    try {
        input = createTokenSchema.parse(await request.json())
    } catch {
        return NextResponse.json({ error: "agentId is required" }, { status: 400 })
    }

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    if (!url || !apiKey || !apiSecret) { return NextResponse.json({ error: "LiveKit is not configured" }, { status: 500 }) }

    try {
        const roomName = `call-${randomUUID()}`
        const identity = `user-${userId}`
        const token = new AccessToken(apiKey, apiSecret, { identity, ttl: "1h" })

        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        })

        const livekit = new LiveKitAPI({ host: url, apiKey, secret: apiSecret, })

        await livekit.agentDispatch.createDispatch(roomName, VOICE_RUNTIME_AGENT_NAME, {
            metadata: JSON.stringify({ agentId: input.agentId }),
        })

        return NextResponse.json({
            token: await token.toJwt(),
            url,
            roomName,
            identity,
            agentName: VOICE_RUNTIME_AGENT_NAME,
        })
    } catch {
        return NextResponse.json({ error: "Failed to create LiveKit token" }, { status: 500 })
    }
}
