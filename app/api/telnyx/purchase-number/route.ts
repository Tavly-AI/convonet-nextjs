import { NextRequest, NextResponse } from "next/server"
import Telnyx from "telnyx"

import { getCurrentWorkspaceTelnyxManagedAccount } from "@/app/dashboard/phone-numbers/_lib/telnyx-subaccount-actions"

function getTelnyxClient(apiKey: string) {
    return new Telnyx({ apiKey })
}

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber } = await request.json()

        if (!phoneNumber) { return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 }) }

        const managedAccount = await getCurrentWorkspaceTelnyxManagedAccount()
        const client = getTelnyxClient(managedAccount.apiKey)

        const order = await client.numberOrders.create({ phone_numbers: [{ phone_number: phoneNumber }], })
        const purchasedNumber = order.data?.phone_numbers?.[0]

        return NextResponse.json({
            orderId: order.data?.id ?? null,
            sid: purchasedNumber?.id ?? null,
            phoneNumber: purchasedNumber?.phone_number ?? null,
            friendlyName: purchasedNumber?.phone_number ?? null,
            capabilities: {
                voice: true,
                SMS: false,
                MMS: false,
                fax: false,
            },
            status: purchasedNumber?.status ?? null,
        })
    } catch (error) {
        console.error("Failed to purchase Telnyx phone number:", error)

        return NextResponse.json({ error: "Failed to purchase Telnyx phone number" }, { status: 500 })
    }
}

// https://developers.telnyx.com/api-reference/phone-number-orders/create-a-number-order