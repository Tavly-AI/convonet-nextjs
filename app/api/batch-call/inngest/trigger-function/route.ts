import { BATCH_CALL_INNGEST_CONSTANTS } from "@/app/dashboard/batch-call/_lib/batch-call-inngest-constants"
import { NextResponse } from "next/server"
import { batchCallInngestClient } from "@/app/dashboard/batch-call/_actions/batch-call-inngest-actions"

export async function POST(request: Request) {
    const { batchCallId, workspaceId } = await request.json()

    const result = await batchCallInngestClient.send({
        name: BATCH_CALL_INNGEST_CONSTANTS.events.batchCreated,
        data: { batchCallId, workspaceId },
    })

    return NextResponse.json(result)
}