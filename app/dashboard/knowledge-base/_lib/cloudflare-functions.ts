export type CrawlRecord = {
  url?: string
  status?: string
  markdown?: string
}

export type CompletedCrawlRecord = CrawlRecord & {
  url: string
  markdown: string
}

export type CrawlResult = {
    status?: string
    records?: CrawlRecord[]
    error?: string
}

export async function startCloudflareCrawl(url: string) {
    const response = await fetch("/api/cloudflare/crawl-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
    })
    const result = (await response.json()) as CrawlResult & { crawlJobId?: string }

    if (!response.ok || !result.crawlJobId) {
        throw new Error(result.error ?? "Could not start the crawl.")
    }

    return result.crawlJobId
}

export async function getCloudflareCrawlResults(jobId: string) {
    const response = await fetch(`/api/cloudflare/crawl-results?jobId=${encodeURIComponent(jobId)}`)
    const result = (await response.json()) as CrawlResult

    if (!response.ok) throw new Error(result.error ?? "Could not retrieve the crawl.")

    return result
}

export function getCompletedCrawlRecords(records: CrawlRecord[] = []): CompletedCrawlRecord[] {
  return records.filter(
    (record): record is CompletedCrawlRecord =>
      record.status === "completed" &&
      isHttpUrl(record.url) &&
            typeof record.markdown === "string" &&
            record.markdown.length > 0
    )
}

// MISC CODE

export function getOrigin(value: string) {
    try {
        const parsedUrl = new URL(value)
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return null

        return parsedUrl.origin
    } catch {
        return null
    }
}

export function getMarkdownFileName(url: string) {
    const parsedUrl = new URL(url)
    const path = parsedUrl.pathname === "/" ? "home" : parsedUrl.pathname.slice(1).replace(/\//g, "-")
    const safeName = `${parsedUrl.hostname}-${path}`.replace(/[^a-zA-Z0-9._-]/g, "-")

    return `${safeName || "web-page"}.md`
}

function isHttpUrl(value: unknown): value is string {
    return typeof value === "string" && getOrigin(value) !== null
}
