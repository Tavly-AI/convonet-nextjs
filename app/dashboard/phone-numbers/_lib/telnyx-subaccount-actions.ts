"use server"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { getTelnyxManagedAccount } from "./telnyx-subaccount-trunk"
import { getTelnyxSipTrunk, updateTelnyxSipTrunk } from "./telnyx-setup-sip-trunk"

export async function getCurrentWorkspaceTelnyxManagedAccount() {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })

    if (!user?.workspaceId) {
        throw new Error("Workspace is required")
    }

    const managedAccount = await getTelnyxManagedAccount(user.workspaceId)
    if (!managedAccount) {
        throw new Error("Telnyx managed account is not configured")
    }

    return managedAccount
}

export async function updateCurrentWorkspaceTelnyxSipTrunk({
    phoneNumber,
}: {
    phoneNumber: string
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

    const [managedAccount, sipTrunk] = await Promise.all([
        getTelnyxManagedAccount(user.workspaceId),
        getTelnyxSipTrunk(user.workspaceId),
    ])

    if (!managedAccount) {
        throw new Error("Telnyx managed account is not configured")
    }

    if (!sipTrunk) {
        throw new Error("Telnyx SIP trunk is not configured")
    }

    if (!sipTrunk.telnyxConnectionId) {
        throw new Error("Telnyx connection ID is not configured")
    }

    return updateTelnyxSipTrunk({
        workspaceId: user.workspaceId,
        managedAccount,
        sipTrunkConnectionId: sipTrunk.id,
        phoneNumber,
        telnyxConnectionId: sipTrunk.telnyxConnectionId,
    })
}
