import type { LiveKitSessionReportPayload } from "./types"

export function calculateLatencyStats(values: number[]) {
    if (values.length === 0) {
        return {
            p50: 0,
            p90: 0,
            p95: 0,
            p99: 0,
            max: 0,
            min: 0,
            num: 0,
            values: [],
        }
    }

    const sorted = [...values].sort((a, b) => a - b)

    const percentile = (p: number) => {
        const index = Math.ceil((p / 100) * sorted.length) - 1
        return sorted[Math.max(0, index)]
    }

    return {
        p50: percentile(50),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99),

        max: sorted[sorted.length - 1],
        min: sorted[0],
        num: sorted.length,

        values,
    }
}


export function checkIsSessionReportPayload(value: unknown): value is LiveKitSessionReportPayload & { agentId: string; callType: "inbound" | "outbound" | "webrtc"; report: LiveKitSessionReportPayload["report"] & { job_id: string } } {
    if (!value || typeof value !== "object") return false

    const body = value as Record<string, unknown>
    if (typeof body.agentId !== "string" || !["inbound", "outbound", "webrtc"].includes(body.callType as string)) return false
    if (!body.report || typeof body.report !== "object") return false

    const report = body.report as Record<string, unknown>
    return typeof report.job_id === "string"
        && !!report.chat_history
        && typeof report.chat_history === "object"
        && Array.isArray((report.chat_history as Record<string, unknown>).items)
}
