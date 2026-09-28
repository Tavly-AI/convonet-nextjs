"use client"

import { useState } from "react"
import { CallHistorySidebar } from "./call-history-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSidebar } from "@/components/ui/sidebar"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { cn } from "@/lib/utils"

export function CallHistoryTableClient({ callRecords }: { callRecords: CallRecordDatabaseData[] }) {
    const [selectedRecord, setSelectedRecord] = useState<CallRecordDatabaseData | null>(null)
    const { state: sidebarState, isMobile } = useSidebar()

    return (
        <section className={cn(
            "m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6",
            !isMobile && sidebarState === "expanded" && "max-w-[calc(100vw-var(--sidebar-width)-2rem)]",
        )}>
            <div><h1 className="text-xl font-semibold tracking-tight">Call history</h1><p className="text-sm text-muted-foreground">Review calls made and received by your agents.</p></div>
            <div className="flex min-h-0 flex-1 flex-col gap-5 xl:flex-row">
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
                    <Table className="min-w-[1750px]">
                        <TableHeader className="bg-muted/60"><TableRow className="hover:bg-transparent"><TableHead className="h-12 pl-4">Time</TableHead><TableHead>Duration</TableHead><TableHead>Channel Type</TableHead><TableHead>End Reason</TableHead><TableHead>Session Status</TableHead><TableHead>User Sentiment</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Direction</TableHead><TableHead>Session Outcome</TableHead><TableHead className="pr-4">End to End Latency</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {callRecords.map((record) => {
                                const duration = formatDuration(record.duration_ms)
                                const startedAt = formatDateTime(record.start_timestamp)
                                const sentiment = getUserSentiment(record.call_analysis)
                                const outcome = getSessionOutcome(record.call_analysis)

                                return <TableRow key={record.call_id} onClick={() => setSelectedRecord(record)} className="cursor-pointer">
                                    <TableCell className="h-14 pl-4 font-medium">{startedAt}</TableCell>
                                    <TableCell>{duration}</TableCell>
                                    <TableCell>{formatChannelType(record.call_type)}</TableCell>
                                    <TableCell>{formatLabel(record.disconnection_reason)}</TableCell>
                                    <TableCell><StatusValue label={formatLabel(record.call_status)} tone={getStatusTone(record.call_status)} /></TableCell>
                                    <TableCell><StatusValue label={sentiment} tone={getSentimentTone(sentiment)} /></TableCell>
                                    <TableCell>{record.from_number ?? "—"}</TableCell>
                                    <TableCell>{record.to_number ?? "—"}</TableCell>
                                    <TableCell>{formatLabel(record.direction)}</TableCell>
                                    <TableCell><StatusValue label={outcome.label} tone={outcome.tone} /></TableCell>
                                    <TableCell className="pr-4">{formatLatency(record.latency?.e2e)}</TableCell>
                                </TableRow>
                            })}
                            {callRecords.length === 0 && <TableRow><TableCell colSpan={11} className="h-24 text-center text-muted-foreground">No calls yet.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
                {selectedRecord && <CallHistorySidebar record={selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)} />}
            </div>
        </section>
    )
}

function getUserSentiment(callAnalysis: unknown) {
    if (!callAnalysis || typeof callAnalysis !== "object" || Array.isArray(callAnalysis)) return "—"
    const sentiment = (callAnalysis as Record<string, unknown>).user_sentiment
    return typeof sentiment === "string" ? sentiment : "—"
}


export function callHistoryGetCallStatus(status: CallRecordDatabaseData["call_status"]): {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
} {
    switch (status) {
        case "registered":
            return {
                label: "Starting",
                variant: "outline",
            }

        case "not_connected":
            return {
                label: "Not connected",
                variant: "destructive",
            }

        case "ongoing":
            return {
                label: "Ongoing",
                variant: "default",
            }

        case "ended":
            return {
                label: "Completed",
                variant: "secondary",
            }

        case "error":
            return {
                label: "Error",
                variant: "destructive",
            }

        default:
            return {
                label: "Unknown",
                variant: "outline",
            }
    }
}


// MISC CODE

type StatusTone = "success" | "danger" | "neutral" | "muted"

function getSentimentTone(sentiment: string): StatusTone {
    switch (sentiment.toLowerCase()) {
        case "positive": return "success"
        case "negative": return "danger"
        case "neutral": return "neutral"
        default: return "muted"
    }
}

function StatusValue({ label, tone }: { label: string, tone: StatusTone }) {
    const dotClass = {
        success: "bg-emerald-500",
        danger: "bg-destructive",
        neutral: "bg-amber-500",
        muted: "bg-muted-foreground/60",
    }[tone]

    return <span className="flex items-center gap-2"><span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden />{label}</span>
}

function formatDateTime(timestamp: bigint | null) {
    if (!timestamp) return "—"
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(Number(timestamp)))
}

function formatDuration(durationMs: number | null) {
    if (durationMs === null) return "—"
    const totalSeconds = Math.floor(durationMs / 1000)
    return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`
}

function formatChannelType(callType: CallRecordDatabaseData["call_type"]) {
    if (callType === "webrtc") return "web_call"
    return callType ?? "—"
}
function formatLabel(value: string | null) {
    return value ? value.replaceAll("_", " ") : "—"
}

function getStatusTone(status: CallRecordDatabaseData["call_status"]): StatusTone {
    if (status === "ended") return "success"
    if (status === "error" || status === "not_connected") return "danger"
    if (status === "ongoing") return "neutral"
    return "muted"
}

function getSessionOutcome(callAnalysis: CallRecordDatabaseData["call_analysis"]): { label: string, tone: StatusTone } {
    if (!callAnalysis) return { label: "—", tone: "muted" }
    return callAnalysis.call_successful ? { label: "Successful", tone: "success" } : { label: "Unsuccessful", tone: "danger" }
}

function formatLatency(latency: NonNullable<CallRecordDatabaseData["latency"]>["e2e"] | undefined) {
    if (!latency || latency.num === 0) return "—"
    return `${latency.p50}ms`
}
