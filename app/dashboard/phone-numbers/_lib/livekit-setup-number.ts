"use server"

import {
    ListUpdate,
    SIPDispatchRule,
    SIPDispatchRuleIndividual,
    SIPOutboundTrunkInfo,
    SIPTransport,
    SIPMediaEncryption,
    RoomAgentDispatch,
    RoomConfiguration,
} from "@livekit/protocol"
import { SipClient } from "livekit-server-sdk"

import { prisma } from "@/lib/prisma"
import { VOICE_RUNTIME_AGENT_NAME } from "@/lib/constants"

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

// used in /phone-numbers
// to update the agent attached to a inbound-trunk
// inbound trunk holds the phone number
export async function updateLiveKitInboundAgentDispatch({ livekitDispatchRuleId, agentId, }: { livekitDispatchRuleId: string; agentId?: string }) {
    const sipClient = getSipClient()
    const [dispatchRule] = await sipClient.listSipDispatchRule({ dispatchRuleIds: [livekitDispatchRuleId], })

    if (!dispatchRule) { throw new Error("LiveKit inbound dispatch rule was not found.") }

    dispatchRule.roomConfig = new RoomConfiguration({
        agents: agentId
            ? [
                new RoomAgentDispatch({
                    agentName: VOICE_RUNTIME_AGENT_NAME,
                    metadata: JSON.stringify({ agentId }),
                }),
            ]
            : [],
    })

    await sipClient.updateSipDispatchRule(livekitDispatchRuleId, dispatchRule)
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
            mediaEncryption: toSipMediaEncryption(transport),
        }
    )

    const inboundTrunk = await sipClient.createSipInboundTrunk(
        `inbound-${sipTrunkConnectionId}`,
        phoneNumbers,
        {
            krispEnabled: true,
            mediaEncryption: SIPMediaEncryption.SIP_MEDIA_ENCRYPT_REQUIRE,
        },
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
                mediaEncryption: toSipMediaEncryption(transport),
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

// SIP media-encryption policy:
//
// OUTBOUND TRUNK
// ----------------
// Media encryption follows the selected SIP transport:
//
//   UDP -> DISABLE
//          Use RTP only. SRTP is disabled.
//
//   TCP -> ALLOW
//          SRTP is supported but not required.
//          The call can use either RTP or SRTP.
//
//   TLS -> REQUIRE
//          SRTP is required. The call fails if the provider does not support it.
//
// For managed Twilio and Telnyx numbers, we pass TLS as the transport,
// so their LiveKit outbound trunks use REQUIRE.
//
// For BYOB trunks, the value depends on the transport selected by the user.
//
//
// INBOUND TRUNK
// ---------------
// Inbound does NOT use this function.
// It is always created with:
//
//   mediaEncryption: SIP_MEDIA_ENCRYPT_REQUIRE
//
// Therefore all inbound calls must use SRTP, regardless of the outbound
// transport setting.
//
//
// DISPATCH RULE
// ---------------
// The dispatch rule has no effect on SIP transport or media encryption.
// It only routes inbound calls into `inbound-` rooms and dispatches the
// configured agent.
function toSipMediaEncryption(value?: string | null) {
    switch (value) {
        case "udp":
            return SIPMediaEncryption.SIP_MEDIA_ENCRYPT_DISABLE
        case "tls":
            return SIPMediaEncryption.SIP_MEDIA_ENCRYPT_REQUIRE
        default:
            return SIPMediaEncryption.SIP_MEDIA_ENCRYPT_ALLOW
    }
}
