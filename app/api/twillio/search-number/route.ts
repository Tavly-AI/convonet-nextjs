import { NextRequest, NextResponse } from "next/server"
import twilio from "twilio"

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const country = searchParams.get("country")
        const search = searchParams.get("search")

        if (!country) { return NextResponse.json({ error: "country is required" }, { status: 400 }) }

        const numbers = await client.availablePhoneNumbers(country).local.list({
            ...(search && { contains: search }),
            voiceEnabled: true,
            limit: 20,
        })

        return NextResponse.json(
            numbers.map(number => ({
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