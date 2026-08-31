"use server"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { getTwilioSubaccount } from "./twillio-subaccount"
import { getTwilioSipTrunk, updateTwilioSipTrunk } from "./twillio-setup-sip-trunk"

export async function getCurrentWorkspaceTwilioSubaccount() {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })

    if (!user?.workspaceId) {
        throw new Error("Workspace is required")
    }

    const subaccount = await getTwilioSubaccount(user.workspaceId)
    if (!subaccount) {
        throw new Error("Twilio subaccount is not configured")
    }

    return subaccount
}

export async function updateCurrentWorkspaceTwilioSipTrunk({
    phoneNumber,
    phoneNumberSid,
}: {
    phoneNumber: string
    phoneNumberSid: string
}) {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })

    if (!user?.workspaceId) {
        throw new Error("Workspace is required")
    }

    const [subaccount, sipTrunk] = await Promise.all([
        getTwilioSubaccount(user.workspaceId),
        getTwilioSipTrunk(user.workspaceId),
    ])

    if (!subaccount) {
        throw new Error("Twilio subaccount is not configured")
    }

    if (!sipTrunk) {
        throw new Error("Twilio SIP trunk is not configured")
    }

    return updateTwilioSipTrunk({
        workspaceId: user.workspaceId,
        twilioSipTrunkId: sipTrunk.id,
        phoneNumber,
        phoneNumberSid,
        subaccountSid: subaccount.sid,
        subaccountAuthToken: subaccount.authToken,
        trunkSid: sipTrunk.trunkSid,
    })
}
