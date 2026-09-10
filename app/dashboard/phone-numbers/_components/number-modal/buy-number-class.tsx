// optimize file
"use client"

import { toast } from "sonner"

import { setupLiveKitNumber, updateLiveKitNumber } from "../../_lib/livekit-setup-number"
import { updateCurrentWorkspaceTelnyxSipTrunk } from "../../_lib/telnyx-subaccount-actions"
import { updateCurrentWorkspaceTwilioSipTrunk } from "../../_lib/twillio-subaccount-actions"
import type { PhoneNumberProvider } from "./filters"

type PurchasedNumber = {
    sid: string
    orderId?: string | null
}

type TelnyxOrderPhoneNumber = {
    phone_number?: string
    requirements_met?: boolean
    status?: "pending" | "success" | "failure"
}

type TelnyxOrderStatusResponse = {
    phoneNumbers?: TelnyxOrderPhoneNumber[]
}

type SipTrunkSetup = {
    sipTrunkConnectionId: string
    twilio?: {
        terminationUri: string
        authUsername: string
        authPassword: string
        livekitOutboundTrunkId: string | null
        livekitInboundTrunkId: string | null
        livekitDispatchRuleId: string | null
    }
    telnyx?: {
        connectionId: string
        terminationUri: string
        authUsername: string
        authPassword: string
        livekitOutboundTrunkId: string | null
        livekitInboundTrunkId: string | null
        livekitDispatchRuleId: string | null
    }
}

export async function buyNumber(phoneNumber: string, provider: PhoneNumberProvider) {

    // TWILLIO PURCHASE NUMBER API
    let purchasedNumber: PurchasedNumber

    try {
        const route = provider === "telnyx" ? "/api/telnyx/purchase-number" : "/api/twillio/purchase-number"
        const response = await fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber }),
        })
        const data = await response.json()

        if (!response.ok) { throw new Error(data.error ?? `Failed to purchase ${provider === "telnyx" ? "Telnyx" : "Twilio"} number.`) }

        purchasedNumber = data
    } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to purchase ${provider === "telnyx" ? "Telnyx" : "Twilio"} number.`)
        return
    }

    if (provider === "telnyx") {
        try {
            if (!purchasedNumber.orderId) { throw new Error("Telnyx did not return a number order ID.") }

            await waitForTelnyxNumberActivation(purchasedNumber.orderId, phoneNumber)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to confirm Telnyx number activation.")
            return
        }
    }

    // UPDATE TWILLIO SIP TRUNKING
    let sipTrunkSetup: SipTrunkSetup

    try {
        sipTrunkSetup = provider === "telnyx"
            ? await updateCurrentWorkspaceTelnyxSipTrunk({ phoneNumber })
            : await updateCurrentWorkspaceTwilioSipTrunk({ phoneNumber, phoneNumberSid: purchasedNumber.sid, })
    } catch (error) {
        toast.error(
            error instanceof Error ? error.message : `Failed to setup ${provider === "telnyx" ? "Telnyx" : "Twilio"} SIP trunk.`
        )
        return
    }

    // LIVEKIT SETUP

    const providerSetup = provider === "telnyx" ? sipTrunkSetup.telnyx : sipTrunkSetup.twilio

    if (!providerSetup) {
        toast.error("SIP trunk setup response is incomplete.")
        return
    }

    try {
        if (
            providerSetup.livekitOutboundTrunkId &&
            providerSetup.livekitInboundTrunkId &&
            providerSetup.livekitDispatchRuleId
        ) {
            await updateLiveKitNumber({
                sipTrunkConnectionId: sipTrunkSetup.sipTrunkConnectionId,
                phoneNumber,
                terminationUri: providerSetup.terminationUri,
                authUsername: providerSetup.authUsername,
                authPassword: providerSetup.authPassword,
                transport: "tls",
                livekitOutboundTrunkId: providerSetup.livekitOutboundTrunkId,
                livekitInboundTrunkId: providerSetup.livekitInboundTrunkId,
                livekitDispatchRuleId: providerSetup.livekitDispatchRuleId,
            })
        } else {
            await setupLiveKitNumber({
                sipTrunkConnectionId: sipTrunkSetup.sipTrunkConnectionId,
                phoneNumber,
                terminationUri: providerSetup.terminationUri,
                authUsername: providerSetup.authUsername,
                authPassword: providerSetup.authPassword,
                transport: "tls",
            })
        }

        toast.success("Phone number purchased successfully.")
    } catch (error) {
        toast.error(
            error instanceof Error ? error.message : "Failed to setup LiveKit number."
        )
    }
}

async function waitForTelnyxNumberActivation(orderId: string, phoneNumber: string) {
    while (true) {
        const response = await fetch(`/api/telnyx/check-number-status?${new URLSearchParams({ orderId }).toString()}`)

        const data = await response.json() as TelnyxOrderStatusResponse & { error?: string }

        if (!response.ok) { throw new Error(data.error ?? "Failed to check Telnyx number order status.") }

        const purchasedNumber = data.phoneNumbers?.find((number) => number.phone_number === phoneNumber)

        if (!purchasedNumber) { throw new Error("Telnyx number order does not include the purchased phone number.") }

        if (purchasedNumber.status === "success" && purchasedNumber.requirements_met) { return }

        if (purchasedNumber.status === "failure") { throw new Error("Telnyx failed to activate the purchased phone number.") }

        await new Promise((resolve) => setTimeout(resolve, 2000))
    }
}
