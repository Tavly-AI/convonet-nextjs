import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LiveMonitoringTableClient } from "./_components/live-monitoring-table-client"

export default async function Page() {
    const userId = await getCurrentUserId()
    if (!userId) return <LiveMonitoringTableClient callRecords={[]} />
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { workspaceId: true } })
    if (!user?.workspaceId) return <LiveMonitoringTableClient callRecords={[]} />

    const callRecords = await prisma.callRecord.findMany({
        where: { workspaceId: user.workspaceId, channel: "voice", call_status: "ongoing" },
        orderBy: { start_timestamp: "desc" },
        select: { agent_id: true, start_timestamp: true, duration_ms: true, call_type: true, from_number: true, to_number: true, call_id: true },
    })

    return <LiveMonitoringTableClient callRecords={callRecords} />
}
