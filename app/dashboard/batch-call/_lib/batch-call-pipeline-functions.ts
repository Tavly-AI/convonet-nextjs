import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { prisma } from "@/lib/prisma"

export const batchCall_MAX_CPS = 5

export async function batchCallGetWorkspaceOngoingCallCount(workspaceId: string): Promise<number> {
    return prisma.callRecord.count({
        where: {
            workspaceId,
            channel: "voice" satisfies CallRecordDatabaseData["channel"],
            call_status: "ongoing" satisfies CallRecordDatabaseData["call_status"],
        },
    })
}
