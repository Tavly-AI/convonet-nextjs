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
import type { AgentChannel } from "@/lib/constants"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"

export type { AgentSessionResult } from "@/app/agents/_lib/helper-actions"

const publishAgentSchema = z.object({
  id: z.string().trim().min(1).nullable(),
  name: z.string().trim().min(1, "Agent name is required.").max(200),
  channel: z.enum(["voice", "chat"]).default("voice"),
  config: z
    .object({
      agentType: z.string().trim().min(1),
      voiceId: z.string().nullable(),
      generalTools: z.array(z.json()),
    })
    .catchall(z.json()),
  llmConfig: z.record(z.string(), z.json()),
})

const conversationalFlowConfigSchema = z.object({
  mainFlowConfig: z.record(z.string(), z.json()),
  subflowConfig: z.record(z.string(), z.json()),
})

const publishAgentVersionSchema = z.object({
  title: z.string().trim().min(1, "Version title is required.").max(200),
  description: z.string().trim().max(1000).optional(),
})

const createAgentSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required.").max(200),
  config: z.record(z.string(), z.json()),
  channel: z.enum(["voice", "chat"]),
  llmConfig: z.record(z.string(), z.json()),
})

type CreateAgentInput = {
  name: string
  config: Record<string, unknown>
  channel: AgentChannel
  llmConfig: Record<string, unknown>
}

// ===============================================================
// ========================= AGENT ===============================
// ===============================================================

export async function createAgent(input: CreateAgentInput) {
  const workspaceId = await getCurrentWorkspaceId()
  const parsed = createAgentSchema.parse(input)
  const agent = await prisma.agent.create({
    data: {
      workspaceId,
      name: parsed.name,
      channel: parsed.channel,
      config: parsed.config as Prisma.InputJsonObject,
      llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
    },
    select: { id: true },
  })

  revalidatePath("/dashboard/agents")
  return agent
}

export async function createConversationalFlowAgent(input: CreateAgentInput) {
  const workspaceId = await getCurrentWorkspaceId()
  const parsed = createAgentSchema.parse(input)

  const agent = await prisma.agent.create({
    data: {
      workspaceId,
      name: parsed.name,
      channel: parsed.channel,
      config: parsed.config as Prisma.InputJsonObject,
      llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
      conversationalFlow: {
        create: {
          workspaceId,
          name: `${parsed.name} Flow`,
          nodes: [],
          components: {},
        },
      },
    },
    select: {
      id: true,
      conversationalFlow: { select: { id: true } },
    },
  })

  if (!agent.conversationalFlow) throw new Error("Failed to create conversational flow.")

  revalidatePath("/dashboard/agents")
  return { agentId: agent.id, conversationalFlowId: agent.conversationalFlow.id }
}

export async function deleteAgent(agentId: string) {
  const workspaceId = await getCurrentWorkspaceId()
  const id = z.string().trim().min(1).parse(agentId)
  const result = await prisma.agent.deleteMany({
    where: { id, workspaceId },
  })

  if (!result.count) throw new Error("Agent not found in the current workspace.")

  revalidatePath("/dashboard/agents")
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
    channel: parsed.channel,
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
export async function autoSaveAgentSession(input: AgentSessionAgent, conversationalFlowConfig?: MainflowSubflowConfig) {
  if (!input.id) return

  const workspaceId = await getCurrentWorkspaceId()
  const parsed = publishAgentSchema.parse(input)

  if (!parsed.id) return

  const agentId = parsed.id
  const agentType = parsed.config.agentType

  // SINGLE PROMPT AGENT
  if (agentType === "single_prompt") {
    await prisma.agent.update({
      where: {
        id: agentId,
        workspaceId,
      },
      data: {
        name: parsed.name,
        channel: parsed.channel,
        config: parsed.config as Prisma.InputJsonObject,
        llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
      },
    })

    return
  }

  // CONVERSATIONAL FLOW AGENT
  if (agentType === "conversational_flow") {
    const parsedFlowConfig = conversationalFlowConfigSchema.parse(conversationalFlowConfig)

    await prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: {
          id: agentId,
          workspaceId,
        },
        data: {
          name: parsed.name,
          channel: parsed.channel,
          config: parsed.config as Prisma.InputJsonObject,
          llmConfig: parsed.llmConfig as Prisma.InputJsonObject,
        },
      })

      await tx.conversationalFlow.updateMany({
        where: {
          agentId,
          workspaceId,
        },
        data: {
          nodes: parsedFlowConfig.mainFlowConfig as Prisma.InputJsonObject,
          components: parsedFlowConfig.subflowConfig as Prisma.InputJsonObject,
        },
      })
    })
  }
}
