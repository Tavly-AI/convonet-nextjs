import twilio from "twilio"

import { prisma } from "@/lib/prisma"

export type TwilioSubaccountResponse = {
    sid: string
    authToken: string
    friendlyName: string
}

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
        throw new Error("Twilio credentials are not configured.")
    }

    return twilio(accountSid, authToken)
}

function toResponse(subaccount: TwilioSubaccountResponse): TwilioSubaccountResponse {
    return {
        sid: subaccount.sid,
        authToken: subaccount.authToken,
        friendlyName: subaccount.friendlyName,
    }
}

export async function getTwilioSubaccount(workspaceId: string) {
    const subaccount = await prisma.twilioSubaccount.findUnique({
        where: { workspaceId },
        select: {
            sid: true,
            authToken: true,
            friendlyName: true,
        },
    })

    return subaccount ? toResponse(subaccount) : null
}

export async function createTwilioSubaccount(
    workspaceId: string,
    friendlyName = "Workspace Twilio subaccount"
) {
    const account = await getTwilioClient().api.v2010.accounts.create({
        friendlyName,
    })

    if (!account.authToken) {
        throw new Error("Twilio did not return a subaccount auth token.")
    }

    try {
        const subaccount = await prisma.twilioSubaccount.create({
            data: {
                workspaceId,
                sid: account.sid,
                authToken: account.authToken,
                friendlyName: account.friendlyName,
            },
            select: {
                sid: true,
                authToken: true,
                friendlyName: true,
            },
        })

        return toResponse(subaccount)
    } catch (error) {
        const subaccount = await prisma.twilioSubaccount.findUnique({
            where: { workspaceId },
            select: {
                sid: true,
                authToken: true,
                friendlyName: true,
            },
        })

        if (subaccount) return toResponse(subaccount)

        throw error
    }
}

export async function getOrCreateTwilioSubaccount(
    workspaceId: string,
    friendlyName = "Workspace Twilio subaccount"
) {
    const existing = await getTwilioSubaccount(workspaceId)
    if (existing) return existing

    return createTwilioSubaccount(workspaceId, friendlyName)
}
