"use server"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"
import { removeLiveKitNumber } from "./livekit-delete-number"
import { releasableNumberProviders } from "../_components/right-display"

export async function deletePhoneNumber(formData: FormData) {
  const phoneNumberId = formData.get("phoneNumberId")

  if (typeof phoneNumberId !== "string" || !phoneNumberId) { throw new Error("Phone number not found.") }

  const workspaceId = await getCurrentWorkspaceId()
  const phoneNumber = await getPhoneNumberForDeletion(phoneNumberId, workspaceId)

  if (!phoneNumber || !releasableNumberProviders.includes(phoneNumber.providerType as typeof releasableNumberProviders[number])) { throw new Error("Phone number not found.") }

  await removePhoneNumberPipeline(phoneNumber)

  revalidatePath("/dashboard/phone-numbers")
}

type PhoneNumberForDeletion = NonNullable<Awaited<ReturnType<typeof getPhoneNumberForDeletion>>>

async function removePhoneNumberPipeline(phoneNumber: PhoneNumberForDeletion) {

  const sipTrunkConnection = phoneNumber.sipTrunkConnection

  if (sipTrunkConnection) {
    const remainingPhoneNumbers = await prisma.phoneNumber.findMany({
      where: {
        sipTrunkConnectionId: sipTrunkConnection.id,
        id: { not: phoneNumber.id },
      },
      select: { phoneNumber: true },
    })

    // used for all cases
    // case 1: delete 1 twillio number from multiple twillio numbers
    // case 2: delete 1 twillio number from single twillio number
    // case 3: delete 1 byob number
    await removeLiveKitNumber({
      providerType: phoneNumber.providerType as typeof releasableNumberProviders[number],
      sipTrunkConnectionId: sipTrunkConnection.id,
      remainingPhoneNumbers: remainingPhoneNumbers.map(({ phoneNumber }) => phoneNumber),
      livekitOutboundTrunkId: sipTrunkConnection.livekitOutboundTrunkId,
      livekitInboundTrunkId: sipTrunkConnection.livekitInboundTrunkId,
      livekitDispatchRuleId: sipTrunkConnection.livekitDispatchRuleId,
    })
  }

  await prisma.phoneNumber.delete({ where: { id: phoneNumber.id } })
}

async function getPhoneNumberForDeletion(phoneNumberId: string, workspaceId: string) {
  return prisma.phoneNumber.findFirst({
    where: { id: phoneNumberId, workspaceId },
    include: { sipTrunkConnection: true },
  })
}
