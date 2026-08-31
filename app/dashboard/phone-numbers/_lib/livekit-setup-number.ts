"use server"

import {
    ListUpdate,
    SIPDispatchRule,
    SIPDispatchRuleIndividual,
    SIPTransport,
} from "@livekit/protocol"
import { SipClient } from "livekit-server-sdk"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type LiveKitSetupNumberInput = {
    phoneNumber: string
    terminationUri: string
    authUsername: string
    authPassword: string
}

export type LiveKitSetupNumberResponse = {
    phoneNumber: string
    livekitOutboundTrunkId: string
    livekitInboundTrunkId: string
    livekitDispatchRuleId: string
}

export type LiveKitUpdateNumberInput = Omit<LiveKitSetupNumberInput, "terminationUri"> & {
    livekitOutboundTrunkId: string
    livekitInboundTrunkId: string
    livekitDispatchRuleId: string
}

function getSipClient() {
    const livekitUrl = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!livekitUrl || !apiKey || !apiSecret) {
        throw new Error("LiveKit credentials are not configured.")
    }

    return new SipClient(livekitUrl, apiKey, apiSecret)
}

function setList(values: string[]) {
    return new ListUpdate({ set: values })
}

function createIndividualDispatchRule() {
    return new SIPDispatchRule({
        rule: {
            case: "dispatchRuleIndividual",
            value: new SIPDispatchRuleIndividual({
                roomPrefix: "inbound-",
            }),
        },
    })
}

async function getCurrentWorkspaceId() {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })

    if (!user?.workspaceId) {
        throw new Error("Workspace is required")
    }

    return user.workspaceId
}

async function getWorkspacePhoneNumbers(workspaceId: string, currentPhoneNumber: string) {
    const phoneNumbers = await prisma.twilioPhoneNumber.findMany({
        where: { workspaceId },
        select: { phoneNumber: true },
        orderBy: { createdAt: "asc" },
    })

    return Array.from(
        new Set([...phoneNumbers.map((phoneNumber) => phoneNumber.phoneNumber), currentPhoneNumber])
    )
}

export async function setupLiveKitNumber({
    phoneNumber,
    terminationUri,
    authUsername,
    authPassword,
}: LiveKitSetupNumberInput): Promise<LiveKitSetupNumberResponse> {
    const sipClient = getSipClient()
    const workspaceId = await getCurrentWorkspaceId()
    const phoneNumbers = await getWorkspacePhoneNumbers(workspaceId, phoneNumber)
    const sipTrunk = await prisma.twilioSipTrunk.findUnique({
        where: { workspaceId },
    })

    if (!sipTrunk) {
        throw new Error("Twilio SIP trunk is not configured")
    }

    const outboundTrunk = await sipClient.createSipOutboundTrunk(
        `outbound-${workspaceId}`,
        terminationUri,
        phoneNumbers,
        {
            authUsername,
            authPassword,
            transport: SIPTransport.SIP_TRANSPORT_TCP,
        }
    )

    const inboundTrunk = await sipClient.createSipInboundTrunk(
        `inbound-${workspaceId}`,
        phoneNumbers,
        {
            krispEnabled: true,
        }
    )

    const dispatchRule = await sipClient.createSipDispatchRule(
        {
            type: "individual",
            roomPrefix: "inbound-",
        },
        {
            name: `dispatch-${workspaceId}`,
            trunkIds: [inboundTrunk.sipTrunkId],
        }
    )

    await prisma.twilioSipTrunk.update({
        where: { workspaceId },
        data: {
            livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
            livekitInboundTrunkId: inboundTrunk.sipTrunkId,
            livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
        },
    })

    return {
        phoneNumber,
        livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
        livekitInboundTrunkId: inboundTrunk.sipTrunkId,
        livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
    }
}

export async function updateLiveKitNumber({
    phoneNumber,
    authUsername,
    authPassword,
    livekitOutboundTrunkId,
    livekitInboundTrunkId,
    livekitDispatchRuleId,
}: LiveKitUpdateNumberInput): Promise<LiveKitSetupNumberResponse> {
    const sipClient = getSipClient()
    const workspaceId = await getCurrentWorkspaceId()
    const phoneNumbers = await getWorkspacePhoneNumbers(workspaceId, phoneNumber)

    const [outboundTrunk, inboundTrunk, dispatchRule] = await Promise.all([
        sipClient.updateSipOutboundTrunkFields(livekitOutboundTrunkId, {
            name: `outbound-${workspaceId}`,
            numbers: setList(phoneNumbers),
            authUsername,
            authPassword,
        }),
        sipClient.updateSipInboundTrunkFields(livekitInboundTrunkId, {
            name: `inbound-${workspaceId}`,
            numbers: setList(phoneNumbers),
        }),
        sipClient.updateSipDispatchRuleFields(livekitDispatchRuleId, {
            name: `dispatch-${workspaceId}`,
            trunkIds: setList([livekitInboundTrunkId]),
            rule: createIndividualDispatchRule(),
        }),
    ])

    await prisma.twilioSipTrunk.update({
        where: { workspaceId },
        data: {
            livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
            livekitInboundTrunkId: inboundTrunk.sipTrunkId,
            livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
        },
    })

    return {
        phoneNumber,
        livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
        livekitInboundTrunkId: inboundTrunk.sipTrunkId,
        livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
    }
}
