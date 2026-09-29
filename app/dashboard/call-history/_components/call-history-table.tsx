import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { CallHistoryTableClient } from "./call-history-table-client"

export async function CallHistoryTable() {
    const userId = await getCurrentUserId()
    const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
        : null
    const voiceAgentIds = user?.workspaceId
        ? (
            await prisma.agent.findMany({
                where: { workspaceId: user.workspaceId, channel: "voice" },
                select: { id: true },
            })
        ).map((agent) => agent.id)
        : []
    const callRecords = user?.workspaceId
        ? await prisma.callRecord.findMany({
            where: { workspaceId: user.workspaceId, agent_id: { in: voiceAgentIds } },
            orderBy: { start_timestamp: "desc" },
        })
        : []

    return <CallHistoryTableClient callRecords={callRecords as CallRecordDatabaseData[]} />
}
