import { SipClient } from "livekit-server-sdk"

import { prisma } from "@/lib/prisma"
import { ListUpdate } from "@livekit/protocol"
import type { releasableNumberProviders } from "../_components/right-display"


type RemoveLiveKitNumberInput = {
    sipTrunkConnectionId: string
    providerType: typeof releasableNumberProviders[number]
    remainingPhoneNumbers: string[]
    livekitOutboundTrunkId: string | null
    livekitInboundTrunkId: string | null
    livekitDispatchRuleId: string | null
}

function setList(values: string[]) {
    return new ListUpdate({ set: values })
}

function getSipClient() {
    const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) { throw new Error("LiveKit credentials are not configured.") }
    return new SipClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
}

export async function removeLiveKitNumber(input: RemoveLiveKitNumberInput) {

    if (input.providerType === "twilio" as typeof releasableNumberProviders[number] && input.remainingPhoneNumbers.length) {
        await deleteTwilioNumberFromSharedTrunk(input)
        return
    }

    if (input.providerType === "twilio" as typeof releasableNumberProviders[number]) {
        await deleteLastTwilioNumber(input)
        return
    }

    if (input.providerType === "custom" as typeof releasableNumberProviders[number]) {
        await deleteByobNumber(input)
    }
}

// case 1: delete 1 twilio-number from multiple Twilio numbers
async function deleteTwilioNumberFromSharedTrunk(input: RemoveLiveKitNumberInput) {
    const sipClient = getSipClient()

    await Promise.all([
        input.livekitOutboundTrunkId &&
        sipClient.updateSipOutboundTrunkFields(input.livekitOutboundTrunkId, {
            numbers: setList(input.remainingPhoneNumbers),
        }),

        input.livekitInboundTrunkId &&
        sipClient.updateSipInboundTrunkFields(input.livekitInboundTrunkId, {
            numbers: setList(input.remainingPhoneNumbers),
        }),
    ])
}

// case 2: delete 1 Twilio number from single Twilio number
async function deleteLastTwilioNumber(input: RemoveLiveKitNumberInput) {
    await deleteLiveKitResources(input)
}

// case 3: delete 1 BYOB number
async function deleteByobNumber(input: RemoveLiveKitNumberInput) {
    await deleteLiveKitResources(input)
}

async function deleteLiveKitResources(input: RemoveLiveKitNumberInput) {
    const sipClient = getSipClient()

    if (input.livekitDispatchRuleId) {
        await sipClient.deleteSipDispatchRule(input.livekitDispatchRuleId)
    }

    await Promise.all([
        input.livekitOutboundTrunkId &&
        sipClient.deleteSipTrunk(input.livekitOutboundTrunkId),

        input.livekitInboundTrunkId &&
        sipClient.deleteSipTrunk(input.livekitInboundTrunkId),
    ])

    await prisma.sipTrunkConnection.update({
        where: { id: input.sipTrunkConnectionId },
        data: {
            livekitOutboundTrunkId: null,
            livekitInboundTrunkId: null,
            livekitDispatchRuleId: null,
        },
    })
}