"use server"

import type {
  AgentSessionAgent,
  AgentSessionSource,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Prisma } from "@/generated/prisma/client"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const publishAgentSchema = z.object({
  id: z.string().trim().min(1).nullable(),
  name: z.string().trim().min(1, "Agent name is required.").max(200),
  config: z
    .object({
      agentType: z.string().trim().min(1),
      voiceId: z.string().nullable(),
      phoneNumber: z.string().nullable(),
      generalTools: z.array(z.json()),
    })
    .catchall(z.json()),
  llmConfig: z.record(z.string(), z.json()),
})

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required.").max(200),
  config: z.record(z.string(), z.json()),
  llmConfig: z.record(z.string(), z.json()),
})


// ===============================================================
// ========================= AGENT ===============================
// ===============================================================

export async function createAgent(input: {
  name: string
  config: Record<string, unknown>
  llmConfig: Record<string, unknown>
}) {
  const workspaceId = await getCurrentWorkspaceId()
  const parsed = createAgentSchema.parse(input)
  const agent = await prisma.agent.create({
    data: {
      workspaceId,
      name: parsed.name,
      config: parsed.config as Prisma.InputJsonObject,
      llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
    },
    select: { id: true },
  })

  revalidatePath("/dashboard/agents")
  return agent
}

export async function loadAgentSession(agentId: string): Promise<AgentSessionSource> {
  const workspaceId = await getCurrentWorkspaceId()
  const id = z.string().trim().min(1).parse(agentId)
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
  })

  if (!agent) throw new Error("Agent not found in the current workspace.")

  return {
    id: agent.id,
    workspaceId: agent.workspaceId,
    name: agent.name,
    config: toJsonRecord(agent.config),
    llmConfig: toJsonRecord(agent.llmConfig),
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }
}

export async function publishAgent(
  input: AgentSessionAgent
): Promise<AgentSessionAgent> {
  const workspaceId = await getCurrentWorkspaceId()

  const parsed = publishAgentSchema.parse(input)
  const data = {
    name: parsed.name,
    config: parsed.config as Prisma.InputJsonObject,
    llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
  }

  let agent
  if (parsed.id) {
    const existingAgent = await prisma.agent.findFirst({
      where: { id: parsed.id, workspaceId },
      select: { id: true },
    })
    if (!existingAgent) throw new Error("Agent not found in the current workspace.")

    agent = await prisma.agent.update({
      where: { id: existingAgent.id },
      data,
    })
  } else {
    agent = await prisma.agent.create({
      data: {
        ...data,
        workspaceId,
      },
    })
  }

  revalidatePath("/dashboard/agents")

  return {
    id: agent.id,
    workspaceId: agent.workspaceId,
    name: agent.name,
    config: parsed.config as AgentSessionAgent["config"],
    llmConfig: parsed.llmConfig,
    createdAt: agent.createdAt.toISOString(),
    updatedAt: agent.updatedAt.toISOString(),
  }
}

// ===============================================================
// ======================= WORKSPACE =============================
// ===============================================================

async function getCurrentWorkspaceId() {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error("Unauthorized")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  })
  if (!user?.workspaceId) throw new Error("A workspace is required to create an agent.")

  return user.workspaceId
}

function toJsonRecord(value: Prisma.JsonValue): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}
