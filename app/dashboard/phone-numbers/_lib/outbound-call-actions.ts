"use server"

import { randomUUID } from "crypto"
import { LiveKitAPI, SipCallError } from "livekit-server-sdk"
import { z } from "zod"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { VOICE_RUNTIME_AGENT_NAME } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

const startOutboundTestCallSchema = z.object({
  phoneNumberId: z.string().trim().min(1),
  destinationNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Enter a valid E.164 number, for example +14155550123."),
})

export async function startOutboundTestCall(input: { phoneNumberId: string; destinationNumber: string }) {

  const parsed = startOutboundTestCallSchema.parse(input)
  const workspaceId = await getCurrentWorkspaceId()

  const phoneNumber = await prisma.phoneNumber.findFirst({
    where: {
      id: parsed.phoneNumberId,
      workspaceId,
    },
    select: {
      phoneNumber: true,
      config: {
        select: {
          outboundAgents: true,
        },
      },
      sipTrunkConnection: {
        select: {
          livekitOutboundTrunkId: true,
        },
      },
    },
  })

  if (!phoneNumber) {
    throw new Error("Phone number not found.")
  }

  const agentId = readAgentId(phoneNumber.config?.outboundAgents)
  if (!agentId) { throw new Error("Select an outbound call agent before placing a test call.") }

  const agent = await prisma.agent.findFirst({
    where: {
      id: agentId,
      workspaceId,
      channel: "voice",
    },
    select: { id: true },
  })

  if (!agent) { throw new Error("The selected outbound call agent is unavailable.") }

  const outboundTrunkId = phoneNumber.sipTrunkConnection?.livekitOutboundTrunkId
  if (!outboundTrunkId) { throw new Error("LiveKit outbound trunk is not configured for this number.") }

  const host = process.env.LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const secret = process.env.LIVEKIT_API_SECRET
  if (!host || !apiKey || !secret) { throw new Error("LiveKit credentials are not configured.") }

  const roomName = `outbound-${randomUUID()}`
  const participantIdentity = `outbound-${randomUUID()}`
  const livekit = new LiveKitAPI({ host, apiKey, secret })

  const dispatch = await livekit.agentDispatch.createDispatch(
    roomName,
    VOICE_RUNTIME_AGENT_NAME,
    {
      metadata: JSON.stringify({ agentId: agent.id }),
    }
  )

  try {
    const participant = await livekit.sip.createSipParticipant(
      outboundTrunkId,
      parsed.destinationNumber,
      roomName,
      {
        fromNumber: phoneNumber.phoneNumber,
        participantIdentity,
        participantName: "Test Call Recipient",
        waitUntilAnswered: true,
        ringingTimeout: 30,
        maxCallDuration: 60 * 15,
      }
    )

    return { roomName, participantIdentity: participant.participantIdentity, sipCallId: participant.sipCallId, }
  } catch (error) {
    await livekit.agentDispatch.deleteDispatch(dispatch.id, roomName).catch(() => undefined)

    if (error instanceof SipCallError) { throw new Error(`Call failed: ${error.sipStatusCode} ${error.sipStatus}`) }
    throw error
  }
}

// MISC CODE

function readAgentId(value: unknown) {
  if (!Array.isArray(value)) return ""

  const agent = value[0]
  if (!agent || typeof agent !== "object" || !("agent_id" in agent)) return ""

  return typeof agent.agent_id === "string" ? agent.agent_id : ""
}
