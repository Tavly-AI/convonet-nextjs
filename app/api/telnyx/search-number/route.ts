import { NextRequest, NextResponse } from "next/server"
import Telnyx from "telnyx"

type TelnyxNumberType = "local" | "toll_free"

function getTelnyxClient() {
    const apiKey = process.env.TELNYX_API_KEY

    if (!apiKey) {
        throw new Error("TELNYX_API_KEY is not configured")
    }

    return new Telnyx({ apiKey })
}

function getPhoneNumberType(type: string | null): TelnyxNumberType {
    return type === "toll-free" ? "toll_free" : "local"
}

function readRegion(
    regionInformation: Array<{ region_name?: string; region_type?: string }> | undefined,
    regionType: string
) {
    return (
        regionInformation?.find((item) => item.region_type === regionType)?.region_name ?? null
    )
}

type TelnyxNumber = {
    phone_number: string
    phone_number_type: string
    best_effort: boolean
    record_type: string
    reservable: boolean
    quickship: boolean
    cost_information: {
        upfront_cost: string
        monthly_cost: string
        currency: string
    }
    features: {
        name: string
    }[]
    vanity_format: string | null
    region_information: {
        region_type: string
        region_name: string
    }[]
}

export type TelnyxAvailableNumber = {
    phoneNumber: string
    friendlyName: string
    locality: string | null
    region: string | null
    postalCode: string | null
    capabilities: {
        voice: boolean
        SMS: boolean
        MMS: boolean
        fax: boolean
    }
}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)

        const country = searchParams.get("country")
        const search = searchParams.get("search")
        const type = searchParams.get("type")

        if (!country) { return NextResponse.json({ error: "country is required" }, { status: 400 }) }

        const client = getTelnyxClient()
        const numbers = await client.availablePhoneNumbers.list({
            filter: {
                country_code: country,
                phone_number_type: getPhoneNumberType(type),
                features: ["voice"],
                limit: 100,
                ...(search?.trim() ? { phone_number: { contains: search.trim(), } } : {}),
            },
        })

        const availableNumbers: TelnyxAvailableNumber[] = ((numbers.data ?? []) as TelnyxNumber[]).map((number) => {
            const regionInformation = number.region_information
            const featureNames = new Set(number.features.map((feature) => feature.name))

            return {
                phoneNumber: number.phone_number,
                friendlyName: number.vanity_format ?? number.phone_number,
                locality: readRegion(regionInformation, "location"),
                region: readRegion(regionInformation, "state") ?? readRegion(regionInformation, "rate_center"),
                postalCode: null,
                capabilities: {
                    voice: featureNames.has("voice"),
                    SMS: featureNames.has("sms"),
                    MMS: featureNames.has("mms"),
                    fax: featureNames.has("fax"),
                },
            }
        })

        return NextResponse.json(availableNumbers)
    } catch (error) {
        console.error("Telnyx number search failed:", error)

        return NextResponse.json({ error: "Failed to search phone numbers" }, { status: 500 })
    }
}
