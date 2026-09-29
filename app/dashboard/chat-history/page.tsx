import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChatHistoryTableClient } from "./_components/chat-history-table-client"

export default async function Page() {
    const userId = await getCurrentUserId()
    const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
        : null
    const records = user?.workspaceId
        ? await prisma.callRecord.findMany({
            where: { workspaceId: user.workspaceId },
            orderBy: { start_timestamp: "desc" },
        })
        : []
    const agents = user?.workspaceId
        ? await prisma.agent.findMany({
            where: { workspaceId: user.workspaceId },
            select: { id: true, channel: true },
        })
        : []
    const agentChannelById = new Map(agents.map((agent) => [agent.id, agent.channel]))

    // Keep records for deleted or unassigned agents visible here; their channel can no longer be determined.
    // The chat history applies the same fallback so no historical records are silently hidden.
    const chatRecords = records.filter((record) => {
        const channel = agentChannelById.get(record.agent_id ?? "")
        return channel === "chat" || channel === undefined
    }) as CallRecordDatabaseData[]

    return <ChatHistoryTableClient chatRecords={chatRecords} />
}
