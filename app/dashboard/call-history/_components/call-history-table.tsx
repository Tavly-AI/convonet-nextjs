import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CallHistoryTableClient } from "./call-history-table-client"

export async function CallHistoryTable() {
    const userId = await getCurrentUserId()
    const user = userId
        ? await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
        : null
    const callRecords = user?.workspaceId
        ? await prisma.callRecord.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { start_timestamp: "desc" } })
        : []

    return <CallHistoryTableClient callRecords={callRecords} />
}
