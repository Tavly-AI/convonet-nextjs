import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { prisma } from "@/lib/prisma"
import type { BatchCallGlobalType } from "./batch-call-global-types"
import { AGENT_CHANNELS } from "@/lib/constants"

export async function batchCallGetWorkspaceCurrentBatchOngoingCallCount(workspaceId: string, batchCallId?: string): Promise<number> {

    const [ongoingCalls, processingTasks] = await Promise.all([
        prisma.callRecord.count({
            where: {
                workspaceId,
                ...(batchCallId ? { batchCallId } : {}),
                channel: AGENT_CHANNELS.VOICE satisfies CallRecordDatabaseData["channel"],
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