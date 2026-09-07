"use server"

import {
    ListUpdate,
    SIPDispatchRule,
    SIPDispatchRuleIndividual,
    SIPOutboundTrunkInfo,
    SIPTransport,
} from "@livekit/protocol"
import { SipClient } from "livekit-server-sdk"

import { prisma } from "@/lib/prisma"

export type LiveKitSetupNumberInput = {
    sipTrunkConnectionId: string
    phoneNumber: string
    terminationUri: string
    authUsername: string
    authPassword: string
    transport?: string | null
}

export type LiveKitSetupNumberResponse = {
    sipTrunkConnectionId: string
    phoneNumber: string
    livekitOutboundTrunkId: string
    livekitInboundTrunkId: string
    livekitDispatchRuleId: string
}

export type LiveKitUpdateNumberInput = {
    sipTrunkConnectionId: string
    phoneNumber: string
    terminationUri: string
    authUsername: string
    authPassword: string
    transport?: string | null
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

async function getSipTrunkPhoneNumbers(sipTrunkConnectionId: string, currentPhoneNumber: string) {
    const phoneNumbers = await prisma.phoneNumber.findMany({
        where: { sipTrunkConnectionId },
        select: { phoneNumber: true },
        orderBy: { createdAt: "asc" },
    })

    return Array.from(
        new Set([...phoneNumbers.map((phoneNumber) => phoneNumber.phoneNumber), currentPhoneNumber])
    )
}

export async function setupLiveKitNumber({
    sipTrunkConnectionId,
    phoneNumber,
    terminationUri,
    authUsername,
    authPassword,
    transport,
}: LiveKitSetupNumberInput): Promise<LiveKitSetupNumberResponse> {
    const sipClient = getSipClient()
    const phoneNumbers = await getSipTrunkPhoneNumbers(sipTrunkConnectionId, phoneNumber)

    const outboundTrunk = await sipClient.createSipOutboundTrunk(
        `outbound-${sipTrunkConnectionId}`,
        terminationUri,
        phoneNumbers,
        {
            authUsername,
            authPassword,
            transport: toSipTransport(transport),
        }
    )

    const inboundTrunk = await sipClient.createSipInboundTrunk(
        `inbound-${sipTrunkConnectionId}`,
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
            name: `dispatch-${sipTrunkConnectionId}`,
            trunkIds: [inboundTrunk.sipTrunkId],
        }
    )

    await prisma.sipTrunkConnection.update({
        where: { id: sipTrunkConnectionId },
        data: {
            livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
            livekitInboundTrunkId: inboundTrunk.sipTrunkId,
            livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
        },
    })

    return {
        sipTrunkConnectionId,
        phoneNumber,
        livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
        livekitInboundTrunkId: inboundTrunk.sipTrunkId,
        livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
    }
}

export async function updateLiveKitNumber({
    sipTrunkConnectionId,
    phoneNumber,
    terminationUri,
    authUsername,
    authPassword,
    transport,
    livekitOutboundTrunkId,
    livekitInboundTrunkId,
    livekitDispatchRuleId,
}: LiveKitUpdateNumberInput): Promise<LiveKitSetupNumberResponse> {
    const sipClient = getSipClient()
    const phoneNumbers = await getSipTrunkPhoneNumbers(sipTrunkConnectionId, phoneNumber)

    const [outboundTrunk, inboundTrunk, dispatchRule] = await Promise.all([
        sipClient.updateSipOutboundTrunk(
            livekitOutboundTrunkId,
            new SIPOutboundTrunkInfo({
                sipTrunkId: livekitOutboundTrunkId,
                name: `outbound-${sipTrunkConnectionId}`,
                address: terminationUri,
                numbers: phoneNumbers,
                authUsername,
                authPassword,
                transport: toSipTransport(transport),
            })
        ),
        sipClient.updateSipInboundTrunkFields(livekitInboundTrunkId, {
            name: `inbound-${sipTrunkConnectionId}`,
            numbers: setList(phoneNumbers),
        }),
        sipClient.updateSipDispatchRuleFields(livekitDispatchRuleId, {
            name: `dispatch-${sipTrunkConnectionId}`,
            trunkIds: setList([livekitInboundTrunkId]),
            rule: createIndividualDispatchRule(),
        }),
    ])

    await prisma.sipTrunkConnection.update({
        where: { id: sipTrunkConnectionId },
        data: {
            livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
            livekitInboundTrunkId: inboundTrunk.sipTrunkId,
            livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
        },
    })

    return {
        sipTrunkConnectionId,
        phoneNumber,
        livekitOutboundTrunkId: outboundTrunk.sipTrunkId,
        livekitInboundTrunkId: inboundTrunk.sipTrunkId,
        livekitDispatchRuleId: dispatchRule.sipDispatchRuleId,
    }
}

// MISC CODE

function toSipTransport(value?: string | null) {
    switch (value) {
        case "udp":
            return SIPTransport.SIP_TRANSPORT_UDP
        case "tls":
            return SIPTransport.SIP_TRANSPORT_TLS
        default:
            return SIPTransport.SIP_TRANSPORT_TCP
    }
}
