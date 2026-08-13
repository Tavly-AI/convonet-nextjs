import { getCurrentUserId } from "@/lib/auth"
import { WorkspaceRole } from "@/lib/enums/roles"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { WorkspaceSettings } from "./_components/workspace-settings"

export default async function Page() {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/auth/login")

  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: { include: { users: true } } },
  })

  if (!user) redirect("/auth/login")

  if (!user.workspace) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: WorkspaceRole.ADMIN,
        workspace: {
          create: { name: "My Workspace" },
        },
      },
      include: { workspace: { include: { users: true } } },
    })
  }

  return (
    <main className="flex flex-1 flex-col p-4">
      <WorkspaceSettings
        workspace={user.workspace!}
        currentUserId={user.id}
      />
    </main>
  )
}
