"use server"

import type {
  AgentSessionAgent,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
  getCurrentWorkspaceId,
  toAgentSession,
} from "@/app/agents/_lib/helper-actions"
import type { AgentSessionResult } from "@/app/agents/_lib/helper-actions"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

export type { AgentSessionResult } from "@/app/agents/_lib/helper-actions"

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

const publishAgentVersionSchema = z.object({
  title: z.string().trim().min(1, "Version title is required.").max(200),
  description: z.string().trim().max(1000).optional(),
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

export async function loadAgentSession(agentId: string): Promise<AgentSessionResult> {
  const workspaceId = await getCurrentWorkspaceId()
  const id = z.string().trim().min(1).parse(agentId)
  const agent = await prisma.agent.findFirst({
    where: { id, workspaceId },
  })

  if (!agent) throw new Error("Agent not found in the current workspace.")

  const latestVersion = await prisma.agentVersion.aggregate({
    where: { agentId: agent.id, workspaceId },
    _max: { version: true },
  })

  return toAgentSession(agent, (latestVersion._max.version ?? -1) + 1)
}

export async function publishAgent(
  input: AgentSessionAgent,
  metadata: { title: string; description?: string }
): Promise<AgentSessionResult> {
  const workspaceId = await getCurrentWorkspaceId()

  const parsed = publishAgentSchema.parse(input)
  const parsedMetadata = publishAgentVersionSchema.parse(metadata)
  const data = {
    name: parsed.name,
    config: parsed.config as Prisma.InputJsonObject,
    llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
  }

  const result = await prisma.$transaction(async (tx) => {
    const existingAgent = parsed.id
      ? await tx.agent.findFirst({
        where: { id: parsed.id, workspaceId },
        select: { id: true },
      })
      : null

    if (parsed.id && !existingAgent) {
      throw new Error("Agent not found in the current workspace.")
    }

    const agent = parsed.id
      ? await tx.agent.update({
        where: { id: parsed.id },
        data,
      })
      : await tx.agent.create({
        data: {
          ...data,
          workspaceId,
        },
      })

    const latestVersion = await tx.agentVersion.aggregate({
      where: { agentId: agent.id, workspaceId },
      _max: { version: true },
    })
    const versionNumber = (latestVersion._max.version ?? -1) + 1

    await tx.agentVersion.create({
      data: {
        workspaceId,
        agentId: agent.id,
        version: versionNumber,
        title: parsedMetadata.title,
        description: parsedMetadata.description || null,
        ...data,
      },
    })

    return {
      agent,
      nextDraftVersion: versionNumber + 1,
    }
  })

  revalidatePath("/dashboard/agents")

  return toAgentSession(result.agent, result.nextDraftVersion)
}
