import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

import { getCurrentWorkspaceTwilioSubaccount } from "@/app/dashboard/phone-numbers/_lib/twillio-subaccount-actions"

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber } = await request.json()

        if (!phoneNumber) { return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 }) }

        const subaccount = await getCurrentWorkspaceTwilioSubaccount()
        const client = twilio(subaccount.sid, subaccount.authToken)

        const number = await client.incomingPhoneNumbers.create({ phoneNumber })

        return NextResponse.json({
            sid: number.sid,
            phoneNumber: number.phoneNumber,
            friendlyName: number.friendlyName,
            capabilities: number.capabilities,
            status: number.status,
        })
    } catch (error) {
        console.error("Failed to purchase Twilio phone number:", error)

        return NextResponse.json({ error: "Failed to purchase Twilio phone number" }, { status: 500 })
    }
}