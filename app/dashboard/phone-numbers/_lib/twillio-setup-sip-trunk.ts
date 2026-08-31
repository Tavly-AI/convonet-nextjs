import { randomBytes } from "crypto"
import twilio from "twilio"

import { prisma } from "@/lib/prisma"

export type TwilioSetupSipTrunkInput = {
    subaccountSid: string
    subaccountAuthToken: string
}

export type TwilioUpdateSipTrunkInput = TwilioSetupSipTrunkInput & {
    workspaceId: string
    twilioSipTrunkId: string
    phoneNumber: string
    trunkSid: string
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
    return prisma.twilioSipTrunk.findUnique({
        where: { workspaceId },
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

    return prisma.twilioSipTrunk.create({
        data: {
            workspace: { connect: { id: workspaceId } },
            twilioSubaccount: { connect: { workspaceId } },
            trunkSid: sipTrunkSetup.twilio.trunkSid,
            terminationUri: sipTrunkSetup.twilio.terminationUri,
            credentialListSid: sipTrunkSetup.twilio.credentialListSid,
            authUsername: sipTrunkSetup.twilio.authUsername,
            authPassword: sipTrunkSetup.twilio.authPassword,
            originationUrlSid: sipTrunkSetup.twilio.originationUrlSid,
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
            trunkSid: trunk.sid,
            terminationUri,

            secure: trunk.secure,
            transferMode: trunk.transferMode,
            transferCallerId: trunk.transferCallerId,

            credentialListSid: credentialList.sid,
            authUsername,
            authPassword,

            originationUrlSid: originationUrl.sid,
        },
    }
}

export async function updateTwilioSipTrunk({
    workspaceId,
    twilioSipTrunkId,
    phoneNumber,
    subaccountSid,
    subaccountAuthToken,
    trunkSid,
    phoneNumberSid,
}: TwilioUpdateSipTrunkInput) {
    const existingPhoneNumber = await prisma.twilioPhoneNumber.findFirst({
        where: {
            OR: [
                { phoneNumber },
                { phoneNumberSid },
            ],
        },
    })

    if (existingPhoneNumber) {
        throw new Error("Phone number is already configured.")
    }

    // setup client
    const client = twilio(subaccountSid, subaccountAuthToken)

    // connect phone number to trunk
    await attachPhoneNumber(client, trunkSid, phoneNumberSid)

    const [sipTrunk] = await prisma.$transaction([
        prisma.twilioSipTrunk.findUniqueOrThrow({
            where: { trunkSid },
        }),
        prisma.twilioPhoneNumber.create({
            data: {
                workspaceId,
                twilioSipTrunkId,
                phoneNumber,
                phoneNumberSid,
                config: {
                    create: {}
                },
            },
        }),
    ])

    return {
        phoneNumber,

        twilio: {
            trunkSid: sipTrunk.trunkSid,
            terminationUri: sipTrunk.terminationUri,
            credentialListSid: sipTrunk.credentialListSid,
            authUsername: sipTrunk.authUsername,
            authPassword: sipTrunk.authPassword,
            originationUrlSid: sipTrunk.originationUrlSid,
            livekitOutboundTrunkId: sipTrunk.livekitOutboundTrunkId,
            livekitInboundTrunkId: sipTrunk.livekitInboundTrunkId,
            livekitDispatchRuleId: sipTrunk.livekitDispatchRuleId,
        },
    }
}

async function attachPhoneNumber(
    client: ReturnType<typeof twilio>,
    trunkSid: string,
    phoneNumberSid: string
) {
    return client.trunking.v1.trunks(trunkSid).phoneNumbers.create({ phoneNumberSid, })
}
