import { NextResponse } from "next/server"

type CrawlRequestBody = {
  url?: unknown
}

type CloudflareCrawlResponse = {
  success?: boolean
  result?: string
  errors?: Array<{ message?: string }>
}

export async function POST(request: Request) {
  let body: CrawlRequestBody

  try {
    body = (await request.json()) as CrawlRequestBody
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 })
  }

  if (typeof body.url !== "string" || !isHttpUrl(body.url)) { return NextResponse.json({ error: "A valid http or https url is required." }, { status: 400 }) }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN

  if (!accountId || !apiToken) { return NextResponse.json({ error: "Cloudflare crawl credentials are not configured." }, { status: 500 }) }

  let response: Response

  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/crawl`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: body.url,
          limit: 100,
          source: "sitemaps",
          formats: ["markdown"],
          render: false,
          crawlPurposes: ["ai-input"],
          contentUse: "reference",
        }),
      }
    )
  } catch {
    return NextResponse.json({ error: "Could not reach Cloudflare." }, { status: 502 })
  }

  const payload = (await response.json().catch(() => null)) as CloudflareCrawlResponse | null

  if (!response.ok || !payload?.success || !payload.result) { return NextResponse.json({ error: payload?.errors?.[0]?.message ?? "Cloudflare could not start the crawl." }, { status: response.status || 502 }) }

  return NextResponse.json({ crawlJobId: payload.result }, { status: 202 })
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
