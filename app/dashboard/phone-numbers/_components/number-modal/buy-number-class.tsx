// optimize file
"use client"

import { toast } from "sonner"

import { setupLiveKitNumber, updateLiveKitNumber } from "../../_lib/livekit-setup-number"
import { updateCurrentWorkspaceTwilioSipTrunk } from "../../_lib/twillio-subaccount-actions"

type TwilioPurchasedNumber = {
    sid: string
}

type TwilioSipTrunkSetup = {
    sipTrunkConnectionId: string
    twilio: {
        terminationUri: string
        authUsername: string
        authPassword: string
        livekitOutboundTrunkId: string | null
        livekitInboundTrunkId: string | null
        livekitDispatchRuleId: string | null
    }
}

export async function buyNumber(phoneNumber1: string) {
    const phoneNumber = phoneNumber1
    // TWILLIO PURCHASE NUMBER API

    const purchasedNumber: TwilioPurchasedNumber = {
        sid: "PN2b7a5bc43c857a2a4c85edbc6905ce71"
    }

    // try {
    //     const response = await fetch("/api/twillio/purchase-number", {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({ phoneNumber }),
    //     })
    //     const data = await response.json()

    //     if (!response.ok) { throw new Error(data.error ?? "Failed to purchase Twilio number.") }

    //     purchasedNumber = data
    // } catch (error) {
    //     toast.error(error instanceof Error ? error.message : "Failed to purchase Twilio number.")
    //     return
    // }

    // UPDATE TWILLIO SIP TRUNKING

    let sipTrunkSetup: TwilioSipTrunkSetup

    try {
        sipTrunkSetup = await updateCurrentWorkspaceTwilioSipTrunk({
            phoneNumber,
            phoneNumberSid: purchasedNumber.sid,
        })
    } catch (error) {
        toast.error(
            error instanceof Error ? error.message : "Failed to setup Twilio SIP trunk."
        )
        return
    }

    // LIVEKIT SETUP

    try {
        if (
            sipTrunkSetup.twilio.livekitOutboundTrunkId &&
            sipTrunkSetup.twilio.livekitInboundTrunkId &&
            sipTrunkSetup.twilio.livekitDispatchRuleId
        ) {
            await updateLiveKitNumber({
                sipTrunkConnectionId: sipTrunkSetup.sipTrunkConnectionId,
                phoneNumber,
                terminationUri: sipTrunkSetup.twilio.terminationUri,
                authUsername: sipTrunkSetup.twilio.authUsername,
                authPassword: sipTrunkSetup.twilio.authPassword,
                transport: "tls",
                livekitOutboundTrunkId: sipTrunkSetup.twilio.livekitOutboundTrunkId,
                livekitInboundTrunkId: sipTrunkSetup.twilio.livekitInboundTrunkId,
                livekitDispatchRuleId: sipTrunkSetup.twilio.livekitDispatchRuleId,
            })
        } else {
            await setupLiveKitNumber({
                sipTrunkConnectionId: sipTrunkSetup.sipTrunkConnectionId,
                phoneNumber,
                terminationUri: sipTrunkSetup.twilio.terminationUri,
                authUsername: sipTrunkSetup.twilio.authUsername,
                authPassword: sipTrunkSetup.twilio.authPassword,
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
