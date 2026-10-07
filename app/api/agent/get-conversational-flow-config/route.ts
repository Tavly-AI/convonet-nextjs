import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const agentIdSchema = z.string().trim().min(1, "agentId is required")

export async function GET(request: NextRequest) {
    const parsedAgentId = agentIdSchema.safeParse(request.nextUrl.searchParams.get("agentId"))
    if (!parsedAgentId.success) { return NextResponse.json({ error: "agentId is required" }, { status: 400 }) }

    try {
        const flow = await prisma.conversationalFlow.findUnique({
            where: { agentId: parsedAgentId.data },
            select: { nodes: true },
        })

        if (!flow) { return NextResponse.json({ error: "Conversational flow not found" }, { status: 404 }) }

        return NextResponse.json({ nodes: flow.nodes })
    } catch {
        return NextResponse.json({ error: "Failed to load conversational flow configuration" }, { status: 500 })
    }
}
