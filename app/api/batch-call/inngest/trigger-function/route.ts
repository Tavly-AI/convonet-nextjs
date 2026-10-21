import { NextResponse } from "next/server"
import { batchCallInngestClient } from "@/app/dashboard/batch-call/_actions/batch-call-inngest-actions"
import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
    const { batchCallId } = await request.json()
    const workspaceId = await getCurrentWorkspaceId()

    const batch = await prisma.batchCall.findFirst({
        where: { id: batchCallId, workspaceId },
        select: { id: true },
    })

    if (!batch) { return NextResponse.json({ error: "Batch not found" }, { status: 404 }) }

    const result = await batchCallInngestClient.send({
        name: "batch-call/created-16oct26",
        data: { batchCallId, workspaceId },
    })

    return NextResponse.json(result)
}