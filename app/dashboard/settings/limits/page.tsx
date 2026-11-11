import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"
import { LimitsSettings } from "./_components/limits-settings"

export default async function Page() {
    const workspaceId = await getCurrentWorkspaceId()
    const workspace = await prisma.workspace.findUniqueOrThrow({
        where: { id: workspaceId },
        select: { concurrentCallsLimit: true },
    })

    return <LimitsSettings concurrentCalls={workspace.concurrentCallsLimit} />
}
