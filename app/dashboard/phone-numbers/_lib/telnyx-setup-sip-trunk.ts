import { randomBytes } from "crypto"
import Telnyx from "telnyx"

import { prisma } from "@/lib/prisma"

export type TelnyxSetupSipTrunkInput = {
    workspaceId: string
}

export type TelnyxManagedAccountCredentials = {
    managedAccountId: string
    apiKey: string
}

export type TelnyxUpdateSipTrunkInput = {
    workspaceId: string
    managedAccount: TelnyxManagedAccountCredentials
    sipTrunkConnectionId: string
    phoneNumber: string
    telnyxConnectionId: string
}

export type TelnyxGetOrCreateSipTrunkInput = {
    workspaceId: string
    managedAccount: TelnyxManagedAccountCredentials
}

type TelnyxSipTrunkSetup = {
    telnyx: {
        connectionId: string
        connectionName: string
        terminationUri: string
        authUsername: string
        authPassword: string
    }
}

type TelnyxSipTrunkUpdateResponse = {
    sipTrunkConnectionId: string
    phoneNumber: string
    telnyx: {
        connectionId: string
        terminationUri: string
        authUsername: string
        authPassword: string
        livekitOutboundTrunkId: string | null
        livekitInboundTrunkId: string | null
        livekitDispatchRuleId: string | null
    }
}

function getTelnyxClient(apiKey: string) {
    return new Telnyx({ apiKey })
}

function generatePassword() {
    return randomBytes(24).toString("base64url")
}

function generateUsername(workspaceId: string) {
    // Telnyx username must be alphanumeric
    return `lk${workspaceId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20)}`
}

export async function getTelnyxSipTrunk(workspaceId: string) {
    return prisma.sipTrunkConnection.findFirst({
        where: {
            workspaceId,
            providerType: "telnyx",
        },
    })
}

export async function getOrCreateTelnyxSipTrunk({ workspaceId, managedAccount }: TelnyxGetOrCreateSipTrunkInput) {

    const existing = await getTelnyxSipTrunk(workspaceId)
    if (existing) { return existing }

    const setup = await setupTelnyxSipTrunk({ workspaceId, managedAccount })

    return prisma.sipTrunkConnection.create({
        data: {
            workspace: { connect: { id: workspaceId } },
            telnyxManagedAccount: { connect: { workspaceId } },
            providerType: "telnyx",
            telnyxConnectionId: setup.telnyx.connectionId,
            terminationUri: setup.telnyx.terminationUri,
            authUsername: setup.telnyx.authUsername,
            authPassword: setup.telnyx.authPassword,
            transport: "tcp",
        },
    })
}

export async function setupTelnyxSipTrunk({
    workspaceId,
    managedAccount
}: TelnyxGetOrCreateSipTrunkInput): Promise<TelnyxSipTrunkSetup> {

    const client = getTelnyxClient(managedAccount.apiKey)

    const authUsername = generateUsername(workspaceId)
    const authPassword = generatePassword()
    const connectionName = `livekit_${workspaceId}`

    const connection = await client.credentialConnections.create({
        connection_name: connectionName,
        user_name: authUsername,
        password: authPassword,
        active: true,
    })

    if (!connection.data?.id) {
        throw new Error("Failed to create Telnyx credential connection.")
    }

    return {
        telnyx: {
            connectionId: connection.data.id,
            connectionName,
            terminationUri: "sip.telnyx.com",
            authUsername,
            authPassword,
        },
    }
}

export async function updateTelnyxSipTrunk({
    workspaceId,
    managedAccount,
    sipTrunkConnectionId,
    phoneNumber,
    telnyxConnectionId,
}: TelnyxUpdateSipTrunkInput): Promise<TelnyxSipTrunkUpdateResponse> {
    const existingPhoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            phoneNumber,
        },
    })

    if (existingPhoneNumber) {
        throw new Error("Phone number is already configured.")
    }

    const client = getTelnyxClient(managedAccount.apiKey)

    await attachPhoneNumber(client, phoneNumber, telnyxConnectionId)

    const [sipTrunk] = await prisma.$transaction([
        prisma.sipTrunkConnection.findUniqueOrThrow({
            where: { telnyxConnectionId },
        }),
        prisma.phoneNumber.create({
            data: {
                workspaceId,
                sipTrunkConnectionId,
                phoneNumber,
                providerType: "telnyx",
                config: {
                    create: {},
                },
            },
        }),
    ])

    if (!sipTrunk.telnyxConnectionId || !sipTrunk.authUsername || !sipTrunk.authPassword) {
        throw new Error("Telnyx SIP trunk connection is incomplete.")
    }

    return {
        sipTrunkConnectionId: sipTrunk.id,
        phoneNumber,
        telnyx: {
            connectionId: sipTrunk.telnyxConnectionId,
            terminationUri: sipTrunk.terminationUri,
            authUsername: sipTrunk.authUsername,
            authPassword: sipTrunk.authPassword,
            livekitOutboundTrunkId: sipTrunk.livekitOutboundTrunkId,
            livekitInboundTrunkId: sipTrunk.livekitInboundTrunkId,
            livekitDispatchRuleId: sipTrunk.livekitDispatchRuleId,
        },
    }
}

async function attachPhoneNumber(
    client: Telnyx,
    phoneNumber: string,
    telnyxConnectionId: string
) {
    return client.phoneNumbers.update(phoneNumber, { connection_id: telnyxConnectionId })
}
