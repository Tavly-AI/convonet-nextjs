import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { WorkspaceSettings } from "./_components/workspace-settings"

export default async function Page() {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: { include: { users: true } } },
  })

  if (!user) redirect("/auth/login")
  if (!user.workspace) redirect("/dashboard")

  return (
    <main className="flex flex-1 flex-col p-4">
      <WorkspaceSettings
        workspace={user.workspace}
        currentUserId={user.id}
      />
    </main>
  )
}
