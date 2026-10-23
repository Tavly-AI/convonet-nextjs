import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { prisma } from "@/lib/prisma"
import type { BatchCallGlobalType } from "./batch-call-global-types"

export async function batchCallGetWorkspaceCurrentBatchOngoingCallCount(workspaceId: string, batchCallId?: string): Promise<number> {

    const [ongoingCalls, processingTasks] = await Promise.all([
        prisma.callRecord.count({
            where: {
                workspaceId,
                ...(batchCallId ? { batchCallId } : {}),
                channel: "voice" satisfies CallRecordDatabaseData["channel"],
                call_status: {
                    in: ["registered", "ongoing"] satisfies CallRecordDatabaseData["call_status"][],
                },
            },
        }),

        prisma.batchCallTask.count({
            where: {
                batchCall: { workspaceId },
                ...(batchCallId ? { batchCallId } : {}),
                workerTaskStatus: "processing" satisfies BatchCallGlobalType["workerTaskStatus"],
            },
        }),
    ])

    return Math.max(ongoingCalls, processingTasks)
}