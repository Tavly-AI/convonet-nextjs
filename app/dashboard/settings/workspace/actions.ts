"use server"

import { getCurrentUserId } from "@/lib/auth"
import { WorkspaceRole } from "@/lib/enums/roles"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const workspacePath = "/dashboard/settings/workspace"

async function getAdmin() {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.workspaceId || user.role !== WorkspaceRole.ADMIN) {
    throw new Error("Only workspace admins can perform this action.")
  }

  return user
}

export async function updateWorkspaceName(name: string) {
  const user = await getAdmin()
  const workspaceName = name.trim()

  if (!workspaceName) throw new Error("Workspace name is required.")

  await prisma.workspace.update({
    where: { id: user.workspaceId! },
    data: { name: workspaceName },
  })
  revalidatePath(workspacePath)
}

export async function addWorkspaceMember(email: string, role: WorkspaceRole) {
  const admin = await getAdmin()
  const member = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })

  if (!member) throw new Error("No account exists for this email.")
  if (member.workspaceId) throw new Error("This user already has a workspace.")

  await prisma.user.update({
    where: { id: member.id },
    data: { workspaceId: admin.workspaceId, role },
  })
  revalidatePath(workspacePath)
}

export async function updateMemberRole(memberId: number, role: WorkspaceRole) {
  const admin = await getAdmin()
  if (memberId === admin.id) throw new Error("You cannot change your own role.")

  await prisma.user.updateMany({
    where: { id: memberId, workspaceId: admin.workspaceId },
    data: { role },
  })
  revalidatePath(workspacePath)
}

export async function removeWorkspaceMember(memberId: number) {
  const admin = await getAdmin()
  if (memberId === admin.id) throw new Error("You cannot remove yourself.")

  await prisma.user.updateMany({
    where: { id: memberId, workspaceId: admin.workspaceId },
    data: { workspaceId: null, role: null },
  })
  revalidatePath(workspacePath)
}

export async function deleteWorkspace() {
  const admin = await getAdmin()

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { workspaceId: admin.workspaceId },
      data: { workspaceId: null, role: null },
    }),
    prisma.workspace.delete({ where: { id: admin.workspaceId! } }),
  ])
}
