import { randomBytes } from "crypto"
import twilio from "twilio"

import { prisma } from "@/lib/prisma"

export type TwilioSetupSipTrunkInput = {
    subaccountSid: string
    subaccountAuthToken: string
}

export type TwilioUpdateSipTrunkInput = TwilioSetupSipTrunkInput & {
    workspaceId: string
    sipTrunkConnectionId: string
    phoneNumber: string
    twilioTrunkSid: string
    phoneNumberSid: string
}

export type TwilioGetOrCreateSipTrunkInput = {
    workspaceId: string
    subaccountSid: string
    subaccountAuthToken: string
}

function generatePassword() {
    return randomBytes(24).toString("base64url")
}

export async function getTwilioSipTrunk(workspaceId: string) {
    return prisma.sipTrunkConnection.findFirst({
        where: {
            workspaceId,
            providerType: "twilio",
        },
    })
}

export async function getOrCreateTwilioSipTrunk({
    workspaceId,
    subaccountSid,
    subaccountAuthToken,
}: TwilioGetOrCreateSipTrunkInput) {
    const existing = await getTwilioSipTrunk(workspaceId)
    if (existing) return existing

    const sipTrunkSetup = await setupTwilioSipTrunk({
        subaccountSid,
        subaccountAuthToken,
    })

    return prisma.sipTrunkConnection.create({
        data: {
            workspace: { connect: { id: workspaceId } },
            twilioSubaccount: { connect: { workspaceId } },
            providerType: "twilio",
            twilioTrunkSid: sipTrunkSetup.twilio.twilioTrunkSid,
            terminationUri: sipTrunkSetup.twilio.terminationUri,
            authUsername: sipTrunkSetup.twilio.authUsername,
            authPassword: sipTrunkSetup.twilio.authPassword,
            transport: "tcp",
        },
    })
}

export async function setupTwilioSipTrunk({ subaccountSid, subaccountAuthToken }: TwilioSetupSipTrunkInput) {

    // setup client
    const client = twilio(subaccountSid, subaccountAuthToken)

    const suffix = subaccountSid.replace(/^AC/, "").slice(0, 12).toLowerCase()

    // create elastic sip truck general
    const terminationUri =
        `platform-${suffix}.pstn.twilio.com`

    const trunk = await client.trunking.v1.trunks.create({
        friendlyName: `trunk_${subaccountSid}`,
        domainName: terminationUri,

        secure: true,

        // SIP REFER + PSTN transfers
        transferMode: "enable-all",

        // Set caller ID as Transferee
        transferCallerId: "from-transferee",
    })

    // create credentials
    const authUsername = `lk_user_${suffix}`
    const authPassword = generatePassword()

    const credentialList = await client.sip.credentialLists.create({ friendlyName: `livekit_${suffix}` })

    await client.sip
        .credentialLists(credentialList.sid)
        .credentials
        .create({
            username: authUsername,
            password: authPassword,
        })

    // attack creds to trunk
    await client.trunking.v1.trunks(trunk.sid).credentialsLists.create({ credentialListSid: credentialList.sid, })

    // add orinagization-uri to the trunk
    const originationUrl = await client.trunking.v1
        .trunks(trunk.sid)
        .originationUrls
        .create({
            friendlyName: "LiveKit",
            sipUrl: process.env.LIVEKIT_ORGANIZATION_SIP_URI!,
            priority: 10,
            weight: 10,
            enabled: true,
        })

    return {
        phoneNumber: null,

        twilio: {
            twilioTrunkSid: trunk.sid,
            terminationUri,

            secure: trunk.secure,
            transferMode: trunk.transferMode,
            transferCallerId: trunk.transferCallerId,

            authUsername,
            authPassword,
        },
    }
}

export async function updateTwilioSipTrunk({
    workspaceId,
    sipTrunkConnectionId,
    phoneNumber,
    subaccountSid,
    subaccountAuthToken,
    twilioTrunkSid,
    phoneNumberSid,
}: TwilioUpdateSipTrunkInput) {
    const existingPhoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            phoneNumber,
        },
    })

    if (existingPhoneNumber) {
        throw new Error("Phone number is already configured.")
    }

    // setup client
    const client = twilio(subaccountSid, subaccountAuthToken)

    // connect phone number to trunk
    await attachPhoneNumber(client, twilioTrunkSid, phoneNumberSid)

    const [sipTrunk] = await prisma.$transaction([
        prisma.sipTrunkConnection.findUniqueOrThrow({
            where: { twilioTrunkSid },
        }),
        prisma.phoneNumber.create({
            data: {
                workspaceId,
                sipTrunkConnectionId,
                phoneNumber,
                providerType: "twilio",
                config: {
                    create: {}
                },
            },
        }),
    ])

    if (!sipTrunk.twilioTrunkSid || !sipTrunk.authUsername || !sipTrunk.authPassword) {
        throw new Error("Twilio SIP trunk connection is incomplete.")
    }

    return {
        sipTrunkConnectionId: sipTrunk.id,
        phoneNumber,

        twilio: {
            twilioTrunkSid: sipTrunk.twilioTrunkSid,
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
    client: ReturnType<typeof twilio>,
    twilioTrunkSid: string,
    phoneNumberSid: string
) {
    return client.trunking.v1.trunks(twilioTrunkSid).phoneNumbers.create({ phoneNumberSid, })
}
