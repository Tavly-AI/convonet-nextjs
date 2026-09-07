import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

type IngestionWebhookPayload = {
    jobId?: string
    status?: string
    raw?: {
        event_timestamp?: number
        event?: {
            ingestion_job_id?: string
            ingestion_job_status?: string
        }
    }
}

export async function POST(request: Request) {
    let payload: IngestionWebhookPayload

    try {
        payload = (await request.json()) as IngestionWebhookPayload
    } catch {
        return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
    }

    const ingestionJobId = payload.jobId?.trim() ?? payload.raw?.event?.ingestion_job_id?.trim() ?? ""

    if (!ingestionJobId) { return NextResponse.json({ error: "Missing ingestion job id." }, { status: 400 }) }

    const normalizedStatus = normalizeStatus(payload.status ?? null)

    if (!normalizedStatus) { return NextResponse.json({ error: "Missing or unsupported ingestion status." }, { status: 400 }) }

    const lastIngestedAt = normalizedStatus === "COMPLETE" ? parseEventTimestamp(payload.raw?.event_timestamp) : undefined

    const result = await prisma.knowledgeBaseSource.updateMany({
        where: {
            ingestionJobId,
        },
        data: {
            status: normalizedStatus,
            ...(lastIngestedAt ? { lastIngestedAt } : {}),
        },
    })

    if (result.count === 0) { return NextResponse.json({ error: "No knowledge base sources found for ingestion job.", ingestionJobId }, { status: 404 }) }

    return NextResponse.json({ ok: true })
}

// MISC CODE

function normalizeStatus(status: string | null) {
    const value = status?.trim().toUpperCase()

    if (!value) return null

    if (value === "COMPLETE") return "COMPLETE"
    if (value === "FAILED") return "FAILED"
    if (value === "STARTING") return "STARTING"

    return null
}

function parseEventTimestamp(value: number | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) { return null }

    return new Date(value)
}
