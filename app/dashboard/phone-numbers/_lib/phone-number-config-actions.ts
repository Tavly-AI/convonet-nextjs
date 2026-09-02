"use server"

import { Prisma } from "@/generated/prisma/client"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"

const phoneNumberIdSchema = z.object({
  phoneNumberId: z.string().trim().min(1),
})

const updatePhoneNumberNicknameSchema = phoneNumberIdSchema.extend({
  nickname: z.string().trim().max(200).optional(),
})

const updateInboundPhoneNumberConfigSchema = phoneNumberIdSchema.extend({
  inboundAgentId: z.string().trim().optional(),
  allowedInboundCountries: z.string().optional(),
  inboundWebhookUrl: z.string().trim().optional(),
  fallbackNumber: z.string().trim().optional(),
})

const updateOutboundPhoneNumberConfigSchema = phoneNumberIdSchema.extend({
  outboundAgentId: z.string().trim().optional(),
  allowedOutboundCountries: z.string().optional(),
})

type UpdatePhoneNumberNicknameInput = z.infer<
  typeof updatePhoneNumberNicknameSchema
>
type UpdateInboundPhoneNumberConfigInput = z.infer<
  typeof updateInboundPhoneNumberConfigSchema
>
type UpdateOutboundPhoneNumberConfigInput = z.infer<
  typeof updateOutboundPhoneNumberConfigSchema
>


export async function savePhoneNumberNickname(
  input: UpdatePhoneNumberNicknameInput
) {
  const parsed = updatePhoneNumberNicknameSchema.parse(input)
  const phoneNumberId = await getPhoneNumberId(parsed.phoneNumberId)

  await prisma.phoneNumberConfig.upsert({
    where: {
      phoneNumberId,
    },
    update: {
      nickname: parsed.nickname || null,
    },
    create: {
      phoneNumberId,
      nickname: parsed.nickname || null,
    },
  })

  revalidatePath("/dashboard/phone-numbers")
}

export async function saveInboundPhoneNumberConfig(
  input: UpdateInboundPhoneNumberConfigInput
) {
  const parsed = updateInboundPhoneNumberConfigSchema.parse(input)
  const phoneNumberId = await getPhoneNumberId(parsed.phoneNumberId)

  await prisma.phoneNumberConfig.upsert({
    where: {
      phoneNumberId,
    },
    update: {
      inboundAgents: parseAgents(parsed.inboundAgentId) as Prisma.InputJsonValue,
      allowedInboundCountryList: parseCountryList(
        parsed.allowedInboundCountries
      ) as Prisma.InputJsonValue,
      inboundWebhookUrl: parsed.inboundWebhookUrl || null,
      fallbackNumber: parsed.fallbackNumber || null,
    },
    create: {
      phoneNumberId,
      inboundAgents: parseAgents(parsed.inboundAgentId) as Prisma.InputJsonValue,
      allowedInboundCountryList: parseCountryList(
        parsed.allowedInboundCountries
      ) as Prisma.InputJsonValue,
      inboundWebhookUrl: parsed.inboundWebhookUrl || null,
      fallbackNumber: parsed.fallbackNumber || null,
    },
  })

  revalidatePath("/dashboard/phone-numbers")
}

export async function saveOutboundPhoneNumberConfig(
  input: UpdateOutboundPhoneNumberConfigInput
) {
  const parsed = updateOutboundPhoneNumberConfigSchema.parse(input)
  const phoneNumberId = await getPhoneNumberId(parsed.phoneNumberId)

  await prisma.phoneNumberConfig.upsert({
    where: {
      phoneNumberId,
    },
    update: {
      outboundAgents: parseAgents(parsed.outboundAgentId) as Prisma.InputJsonValue,
      allowedOutboundCountryList: parseCountryList(
        parsed.allowedOutboundCountries
      ) as Prisma.InputJsonValue,
    },
    create: {
      phoneNumberId,
      outboundAgents: parseAgents(parsed.outboundAgentId) as Prisma.InputJsonValue,
      allowedOutboundCountryList: parseCountryList(
        parsed.allowedOutboundCountries
      ) as Prisma.InputJsonValue,
    },
  })

  revalidatePath("/dashboard/phone-numbers")
}

export type PhoneNumberWithConfig =
  Prisma.PhoneNumberGetPayload<{
    include: {
      config: true
    }
  }>

export async function getPhoneNumbers(): Promise<PhoneNumberWithConfig[]> {
  const workspaceId = await getCurrentWorkspaceId()

  return prisma.phoneNumber.findMany({
    where: {
      workspaceId,
    },
    include: {
      config: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  })
}


// MISC CODE

function parseCountryList(value?: string) {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    )
  )
}

function parseAgents(agentId?: string) {
  if (!agentId) return []

  return [
    {
      agent_id: agentId,
      weight: 1,
      agent_version: "latest_published",
    },
  ]
}

async function getPhoneNumberId(phoneNumberId: string) {
  const workspaceId = await getCurrentWorkspaceId()

  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      id: phoneNumberId,
      workspaceId,
    },
    select: {
      id: true,
    },
  })

  if (!phoneNumber) {
    throw new Error("Phone number not found.")
  }

  return phoneNumber.id
}
