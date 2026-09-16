import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const agentIdSchema = z.string().trim().min(1, "agentId is required")

export async function GET(request: NextRequest) {
    const parsedAgentId = agentIdSchema.safeParse(request.nextUrl.searchParams.get("agentId"))

    if (!parsedAgentId.success) { return NextResponse.json({ error: "agentId is required" }, { status: 400 }) }

    try {
        const agent = await prisma.agent.findUnique({
            where: { id: parsedAgentId.data },
            select: {
                id: true,
                name: true,
                channel: true,
                config: true,
                llmConfig: true,
            },
        })

        if (!agent) { return NextResponse.json({ error: "Agent not found" }, { status: 404 }) }

        return NextResponse.json(agent)
    } catch (error) {
        return NextResponse.json({ error: "Failed to load agent configuration" }, { status: 500 })
    }
}
