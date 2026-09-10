import { NextRequest, NextResponse } from "next/server"
import Telnyx from "telnyx"

import { getCurrentWorkspaceTelnyxManagedAccount } from "@/app/dashboard/phone-numbers/_lib/telnyx-subaccount-actions"

function getTelnyxClient(apiKey: string) {
    return new Telnyx({ apiKey })
}

export async function GET(request: NextRequest) {
    try {
        const orderId = new URL(request.url).searchParams.get("orderId")

        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 })
        }

        const managedAccount = await getCurrentWorkspaceTelnyxManagedAccount()
        const client = getTelnyxClient(managedAccount.apiKey)
        const order = await client.numberOrders.retrieve(orderId)

        return NextResponse.json({
            orderId: order.data?.id ?? orderId,
            status: order.data?.status ?? null,
            phoneNumbers: order.data?.phone_numbers ?? [],
        })
    } catch (error) {
        console.error("Failed to check Telnyx number order status:", error)

        return NextResponse.json(
            { error: "Failed to check Telnyx number order status" },
            { status: 500 }
        )
    }
}

// https://developers.telnyx.com/api-reference/phone-number-orders/retrieve-a-number-order