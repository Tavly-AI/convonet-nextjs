import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"
import type { LocalInstance } from "twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/local"
import type { TollFreeInstance } from "twilio/lib/rest/api/v2010/account/availablePhoneNumberCountry/tollFree"

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const country = searchParams.get("country")
        const search = searchParams.get("search")
        const type = searchParams.get("type")

        if (!country) { return NextResponse.json({ error: "country is required" }, { status: 400 }) }

        const numberSearchOptions = {
            ...(search ? { contains: search } : {}),
            voiceEnabled: true,
            limit: 100,
        }

        const numbers =
            type === "toll-free"
                ? await client.availablePhoneNumbers(country).tollFree.list(numberSearchOptions)
                : await client.availablePhoneNumbers(country).local.list(numberSearchOptions)

        return NextResponse.json(
            numbers.map((number: LocalInstance | TollFreeInstance) => ({
                phoneNumber: number.phoneNumber,
                friendlyName: number.friendlyName,
                locality: number.locality,
                region: number.region,
                postalCode: number.postalCode,
                capabilities: number.capabilities,
            }))
        )
    } catch (error) {
        console.error("Twilio number search failed:", error)

        return NextResponse.json({ error: "Failed to search phone numbers" }, { status: 500 })
    }
}
