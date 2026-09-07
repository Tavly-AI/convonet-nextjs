import { NextResponse } from "next/server"

type CloudflareResponse = {
    success?: boolean
    result?: unknown
    errors?: Array<{ message?: string }>
}

export async function GET(request: Request) {
    const jobId = new URL(request.url).searchParams.get("jobId")?.trim()

    if (!jobId) { return NextResponse.json({ error: "A crawl jobId is required." }, { status: 400 }) }

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) { return NextResponse.json({ error: "Cloudflare crawl credentials are not configured." }, { status: 500 }) }

    let response: Response

    try {
        response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl/${encodeURIComponent(jobId)}`,
            { headers: { Authorization: `Bearer ${apiToken}` }, }
        )
    } catch {
        return NextResponse.json({ error: "Could not reach Cloudflare." }, { status: 502 })
    }

    const payload = (await response.json().catch(() => null)) as CloudflareResponse | null

    if (!response.ok || !payload?.success) { return NextResponse.json({ error: payload?.errors?.[0]?.message ?? "Cloudflare could not retrieve the crawl." }, { status: response.status || 502 }) }

    return NextResponse.json(payload.result)
}
