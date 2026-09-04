import Telnyx from "telnyx"
import type { ManagedAccounts } from "telnyx/resources/managed-accounts/managed-accounts"

import { prisma } from "@/lib/prisma"

export type TelnyxManagedAccountResponse = {
    managedAccountId: string
    apiKey: string
}

function getTelnyxClient() {
    const apiKey = process.env.TELNYX_API_KEY

    if (!apiKey) {
        throw new Error("TELNYX_API_KEY is not configured")
    }

    return new Telnyx({ apiKey })
}

function toResponse(
    managedAccount: TelnyxManagedAccountResponse
): TelnyxManagedAccountResponse {
    return {
        managedAccountId: managedAccount.managedAccountId,
        apiKey: managedAccount.apiKey,
    }
}

export async function getTelnyxManagedAccount(workspaceId: string) {
    const managedAccount = await prisma.telnyxManagedAccount.findUnique({
        where: { workspaceId },
        select: {
            managedAccountId: true,
            apiKey: true,
        },
    })

    return managedAccount ? toResponse(managedAccount) : null
}

export async function createTelnyxManagedAccount(workspaceId: string) {
    const businessName = "Workspace Telnyx managed account"

    const params: ManagedAccounts.ManagedAccountCreateParams = { business_name: businessName }

    const account = await getTelnyxClient().managedAccounts.create(params)
    const managedAccountId = account.data?.id
    const apiKey = account.data?.api_key

    if (!managedAccountId) { throw new Error("Telnyx did not return a managed account id.") }
    if (!apiKey) { throw new Error("Telnyx did not return a managed account api key.") }

    try {
        const managedAccount = await prisma.telnyxManagedAccount.create({
            data: {
                workspaceId,
                managedAccountId,
                apiKey,
            },
            select: {
                managedAccountId: true,
                apiKey: true,
            },
        })

        return toResponse(managedAccount)
    } catch (error) {
        const managedAccount = await prisma.telnyxManagedAccount.findUnique({
            where: { workspaceId },
            select: {
                managedAccountId: true,
                apiKey: true,
            },
        })

        if (managedAccount) return toResponse(managedAccount)

        throw error
    }
}

export async function getOrCreateTelnyxManagedAccount(workspaceId: string) {
    const existing = await getTelnyxManagedAccount(workspaceId)
    if (existing) return existing

    return createTelnyxManagedAccount(workspaceId)
}
