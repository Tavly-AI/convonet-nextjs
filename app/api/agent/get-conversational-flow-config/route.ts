import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"

export const runtime = "nodejs"

const agentIdSchema = z.string().trim().min(1, "agentId is required")

export async function GET(request: NextRequest) {
    const parsedAgentId = agentIdSchema.safeParse(request.nextUrl.searchParams.get("agentId"))
    if (!parsedAgentId.success) { return NextResponse.json({ error: "agentId is required" }, { status: 400 }) }

    try {
        const flow = await prisma.conversationalFlow.findUnique({
            where: { agentId: parsedAgentId.data },
            select: { nodes: true, components: true },
        })

        if (!flow) { return NextResponse.json({ error: "Conversational flow not found" }, { status: 404 }) }

        const config = { mainFlowConfig: flow.nodes, subflowConfig: flow.components } as MainflowSubflowConfig
        return NextResponse.json(config)
    } catch {
        return NextResponse.json({ error: "Failed to load conversational flow configuration" }, { status: 500 })
    }
}
