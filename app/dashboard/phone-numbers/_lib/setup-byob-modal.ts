"use server"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { setupLiveKitNumber, updateLiveKitNumber } from "@/app/dashboard/phone-numbers/_lib/livekit-setup-number"
import { prisma } from "@/lib/prisma"

export type SetupByobInput = {
    existingPhoneNumber?: string
    phoneNumber: string
    terminationUri: string
    authUsername?: string | null
    authPassword?: string | null
    transport: "tcp" | "udp" | "tls"
}

export async function saveByobDetails(input: SetupByobInput) {
    const workspaceId = await getCurrentWorkspaceId()
    const existingPhoneNumber = normalizeString(input.existingPhoneNumber)
    const phoneNumber = normalizeRequiredString(input.phoneNumber, "Phone number is required.")
    const terminationUri = normalizeRequiredString(input.terminationUri, "Termination URI is required.")
    const authUsername = normalizeString(input.authUsername)
    const authPassword = normalizeString(input.authPassword)
    const transport = normalizeTransport(input.transport)

    if (existingPhoneNumber) {
        await updateExistingByobPhoneNumber({
            workspaceId,
            existingPhoneNumber,
            terminationUri,
            authUsername,
            authPassword,
            transport,
        })
    } else {
        await createByobPhoneNumber({
            workspaceId,
            phoneNumber,
            terminationUri,
            authUsername,
            authPassword,
            transport,
        })
    }

    revalidatePath("/dashboard/phone-numbers")
}

async function updateExistingByobPhoneNumber({
    workspaceId,
    existingPhoneNumber,
    terminationUri,
    authUsername,
    authPassword,
    transport,
}: {
    workspaceId: string
    existingPhoneNumber: string
    terminationUri: string
    authUsername: string | null
    authPassword: string | null
    transport: "tcp" | "udp" | "tls"
}) {
    const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            workspaceId,
            phoneNumber: existingPhoneNumber,
        },
        select: {
            id: true,
            sipTrunkConnectionId: true,
            config: {
                select: {
                    id: true,
                },
            },
        },
    })

    if (!phoneNumber) {
        throw new Error("Phone number not found.")
    }

    if (!phoneNumber.sipTrunkConnectionId) {
        throw new Error("Phone number is missing a SIP trunk connection.")
    }

    if (!phoneNumber.config?.id) {
        throw new Error("Phone number is missing a phone number config.")
    }

    const sipTrunkConnection = await prisma.sipTrunkConnection.update({
        where: {
            id: phoneNumber.sipTrunkConnectionId,
        },
        data: {
            providerType: "custom",
            terminationUri,
            authUsername,
            authPassword,
            transport,
        },
    })

    // setup livekit number
    if (
        !sipTrunkConnection.livekitOutboundTrunkId ||
        !sipTrunkConnection.livekitInboundTrunkId ||
        !sipTrunkConnection.livekitDispatchRuleId
    ) {
        throw new Error("LiveKit is not configured for this BYOB number.")
    }

    await updateLiveKitNumber({
        sipTrunkConnectionId: sipTrunkConnection.id,
        phoneNumber: existingPhoneNumber,
        terminationUri: sipTrunkConnection.terminationUri,
        authUsername: sipTrunkConnection.authUsername ?? "",
        authPassword: sipTrunkConnection.authPassword ?? "",
        transport: sipTrunkConnection.transport,
        livekitOutboundTrunkId: sipTrunkConnection.livekitOutboundTrunkId,
        livekitInboundTrunkId: sipTrunkConnection.livekitInboundTrunkId,
        livekitDispatchRuleId: sipTrunkConnection.livekitDispatchRuleId,
    })
}

async function createByobPhoneNumber({
    workspaceId,
    phoneNumber,
    terminationUri,
    authUsername,
    authPassword,
    transport,
}: {
    workspaceId: string
    phoneNumber: string
    terminationUri: string
    authUsername: string | null
    authPassword: string | null
    transport: "tcp" | "udp" | "tls"
}) {
    const existingPhoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            workspaceId,
            phoneNumber,
        },
        select: {
            id: true,
        },
    })

    if (existingPhoneNumber) {
        throw new Error("Phone number already exists. Use the edit flow instead.")
    }

    const sipTrunkConnection = await prisma.$transaction(async (tx) => {
        const sipTrunkConnection = await tx.sipTrunkConnection.create({
            data: {
                workspace: { connect: { id: workspaceId } },
                providerType: "custom",
                terminationUri,
                authUsername,
                authPassword,
                transport,
            },
        })

        await tx.phoneNumber.create({
            data: {
                workspace: { connect: { id: workspaceId } },
                phoneNumber,
                providerType: "custom",
                sipTrunkConnection: {
                    connect: { id: sipTrunkConnection.id },
                },
                config: {
                    create: {},
                },
            },
        })

        return {
            id: sipTrunkConnection.id,
            terminationUri: sipTrunkConnection.terminationUri,
            authUsername: sipTrunkConnection.authUsername,
            authPassword: sipTrunkConnection.authPassword,
            transport: sipTrunkConnection.transport,
        }
    })

    await setupLiveKitNumber({
        sipTrunkConnectionId: sipTrunkConnection.id,
        phoneNumber,
        terminationUri: sipTrunkConnection.terminationUri,
        authUsername: sipTrunkConnection.authUsername ?? "",
        authPassword: sipTrunkConnection.authPassword ?? "",
        transport: sipTrunkConnection.transport,
    })
}

// MISC CODE

function normalizeRequiredString(value: string | null | undefined, message: string) {
    const normalized = normalizeString(value)
    if (!normalized) {
        throw new Error(message)
    }

    return normalized
}

function normalizeString(value: string | null | undefined) {
    if (!value) return null

    const normalized = value.trim()
    return normalized || null
}

function normalizeTransport(value: string | null | undefined): "tcp" | "udp" | "tls" {
    return value === "udp" || value === "tls" ? value : "tcp"
}
