import type {
  AgentSessionAgent,
  AgentSessionSource,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Prisma } from "@/generated/prisma/client"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type AgentSessionResult = AgentSessionSource & {
  draftVersion: number
}

export async function getCurrentWorkspaceId() {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  })
  if (!user?.workspaceId) throw new Error("A workspace is required to create an agent.")

  return user.workspaceId
}

export function toAgentSession(agent: {
  id: string
  workspaceId: string
  name: string
  channel: string
  config: Prisma.JsonValue
  llmConfig: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}, draftVersion: number): AgentSessionResult {
  return {
    id: agent.id,
    workspaceId: agent.workspaceId,
    name: agent.name,
    channel: toAgentChannel(agent.channel),
    config: toJsonRecord(agent.config),
    llmConfig: toJsonRecord(agent.llmConfig),
    draftVersion,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }
}

function toAgentChannel(channel: string): AgentSessionAgent["channel"] {
  return channel === "chat" ? "chat" : "voice"
}

function toJsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}
