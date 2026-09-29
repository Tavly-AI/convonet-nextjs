import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CallHistoryTableClient } from "./_components/call-history-table-client"

export default async function Page() {
    const userId = await getCurrentUserId()
    const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
        : null
    const callRecords = user?.workspaceId
        ? await prisma.callRecord.findMany({
            where: { workspaceId: user.workspaceId, channel: "voice" },
            orderBy: { start_timestamp: "desc" },
        })
        : [] as CallRecordDatabaseData[]

    return <CallHistoryTableClient callRecords={callRecords as CallRecordDatabaseData[]} />
}
