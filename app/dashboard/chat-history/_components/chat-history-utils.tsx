import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"

type StatusTone = "success" | "danger" | "neutral" | "muted"

export function formatDateTime(timestamp: bigint | null) {
    if (!timestamp) return "—"
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(Number(timestamp)))
}

export function formatDuration(durationMs: number | null) {
    if (durationMs === null) return "—"
    const totalSeconds = Math.floor(durationMs / 1000)
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`
}

export function getMessageCount(transcript: CallRecordDatabaseData["transcript_object"]) {
    return transcript?.length ?? 0
}

export function getUserSentiment(callAnalysis: CallRecordDatabaseData["call_analysis"]) {
    return callAnalysis?.user_sentiment ?? "—"
}

export function getSessionStatusTone(status: CallRecordDatabaseData["call_status"]): StatusTone {
    if (status === "ended") return "success"
    if (status === "error" || status === "not_connected") return "danger"
    if (status === "ongoing") return "neutral"
    return "muted"
}

export function getSessionOutcome(callAnalysis: CallRecordDatabaseData["call_analysis"]): { label: string; tone: StatusTone } {
    if (!callAnalysis) return { label: "—", tone: "muted" }
    return callAnalysis.call_successful ? { label: "Successful", tone: "success" } : { label: "Unsuccessful", tone: "danger" }
}

export function getSessionStatus(status: CallRecordDatabaseData["call_status"]) {
    switch (status) {
        case "registered": return { label: "Starting", variant: "outline" as const }
        case "not_connected": return { label: "Not connected", variant: "destructive" as const }
        case "ongoing": return { label: "Ongoing", variant: "default" as const }
        case "ended": return { label: "Completed", variant: "secondary" as const }
        case "error": return { label: "Error", variant: "destructive" as const }
        default: return { label: "Unknown", variant: "outline" as const }
    }
}

export function getSentimentTone(sentiment: string): StatusTone {
    switch (sentiment.toLowerCase()) {
        case "positive": return "success"
        case "negative": return "danger"
        case "neutral": return "neutral"
        default: return "muted"
    }
}

export function HistoryStatusValue({ label, tone }: { label: string; tone: StatusTone }) {
    const dotClass = {
        success: "bg-emerald-500",
        danger: "bg-destructive",
        neutral: "bg-amber-500",
        muted: "bg-muted-foreground/60",
    }[tone]

    return <span className="flex items-center gap-2"><span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />{label}</span>
}
