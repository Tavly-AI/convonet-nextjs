import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { prisma } from "@/lib/prisma"
import type { BatchCallGlobalType } from "./batch-call-global-types"

export const BATCH_CALL_MAX_CPS = 1
export const BATCH_CALL_CONCURRENCY = 5

export async function batchCallGetWorkspaceOngoingCallCount(workspaceId: string): Promise<number> {
    return prisma.callRecord.count({
        where: {
            workspaceId,
            channel: "voice" satisfies CallRecordDatabaseData["channel"],
            call_status: "ongoing" satisfies CallRecordDatabaseData["call_status"],
        },
    })
}