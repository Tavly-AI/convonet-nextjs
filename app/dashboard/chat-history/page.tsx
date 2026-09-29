import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ChatHistoryTableClient } from "./_components/chat-history-table-client"

export default async function Page() {
    const userId = await getCurrentUserId()
    const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
        : null
    const chatRecords = user?.workspaceId
        ? await prisma.callRecord.findMany({
            where: { workspaceId: user.workspaceId, channel: "chat" },
            orderBy: { start_timestamp: "desc" },
        })
        : [] as CallRecordDatabaseData[]

    return <ChatHistoryTableClient chatRecords={chatRecords as CallRecordDatabaseData[]} />
}
