"use client"

import { useState } from "react"
import { CallHistorySidebar } from "./call-history-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSidebar } from "@/components/ui/sidebar"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { cn } from "@/lib/utils"
import { InfoIcon } from "lucide-react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

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
                        <TableHeader className="bg-muted/60"><TableRow className="hover:bg-transparent"><TableHead className="h-12 pl-4">Time</TableHead><TableHead>Duration</TableHead><TableHead>Call Type</TableHead><TableHead>Cost</TableHead><TableHead>End Reason</TableHead><TableHead>Session Status</TableHead><TableHead>User Sentiment</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Channel</TableHead><TableHead>Session Outcome</TableHead><TableHead className="pr-4">End to End Latency</TableHead></TableRow></TableHeader>
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
                                    <TableCell><Billing_CallCost_Charges_BreakDown_Modal record={record} /></TableCell>
                                    <TableCell>{formatLabel(record.disconnection_reason)}</TableCell>
                                    <TableCell><StatusValue label={formatLabel(record.call_status)} tone={getStatusTone(record.call_status)} /></TableCell>
                                    <TableCell><StatusValue label={sentiment} tone={getSentimentTone(sentiment)} /></TableCell>
                                    <TableCell>{record.from_number ?? "—"}</TableCell>
                                    <TableCell>{record.to_number ?? "—"}</TableCell>
                                    <TableCell>{formatChannel(record.channel)}</TableCell>
                                    <TableCell><StatusValue label={outcome.label} tone={outcome.tone} /></TableCell>
                                    <TableCell className="pr-4">{formatLatency(record.latency?.e2e)}</TableCell>
                                </TableRow>
                            })}
                            {callRecords.length === 0 && <TableRow><TableCell colSpan={12} className="h-24 text-center text-muted-foreground">No calls yet.</TableCell></TableRow>}
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
function formatChannel(channel: CallRecordDatabaseData["channel"]) {
    return channel === "chat" ? "Chat" : "Voice"
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

// attached with billing_callCost in app/dashboard/billing/_actions/billing-initialize-post-service-pipeline.ts
const billingUnitByProduct: Record<string, "message" | "dial" | "min" | undefined> = {
    telephony: "min",
    tts: "min",
    stt: "min",
    llm: "min",
    chat_llm: "message",
    short_call_surcharge: undefined,
    kb: "min",
    batch_call: "dial",
    safety_guardrails: "min",
    pii_removal: "min",
    advanced_denoising: "min",
    llm_token_surcharge: "min",
}

export function Billing_CallCost_Charges_BreakDown_Modal({ record }: { record: CallRecordDatabaseData }) {
    const [open, setOpen] = useState(false)
    const callCost = record.call_cost

    if (!callCost) return <span className="text-muted-foreground">—</span>

    const minutes = (callCost?.total_duration_seconds ?? (record.duration_ms ?? 0) / 1000) / 60
    const products = (callCost.product_costs ?? []).filter(item => (item.cost ?? 0) !== 0)
    const total = callCost?.combined_cost ?? products.reduce((sum, item) => sum + (item.cost ?? 0), 0)
    const rate = minutes > 0 ? total / minutes : 0

    const formatCost = (value?: number | null) => `$${(value ?? 0).toFixed(4)}`
    const formatRate = (value?: number | null) => `$${(value ?? 0).toFixed(4)}/min`

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={
                    <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 hover:text-primary"
                    />
                }
            >
                ${total.toFixed(3)}
                <InfoIcon className="size-3.5 text-muted-foreground" />
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="bottom"
                className="w-[390px] space-y-3 p-3"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs text-muted-foreground">Total cost</p>
                    <p className="text-lg font-semibold">{formatCost(total)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium">
                            {formatDuration(minutes * 60000)}
                            <span className="ml-1 text-xs text-muted-foreground">
                                ({minutes.toFixed(3)} min)
                            </span>
                        </p>
                    </div>

                    <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Average per minute</p>
                        <p className="text-sm font-medium">{formatRate(rate)}</p>
                    </div>
                </div>

                <div className="border-t pt-3">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium">
                        <span>Service</span>
                        <span>Cost</span>
                    </div>

                    <div className="space-y-2">
                        {products.map((item, index) => (
                            <div
                                key={`${item.product}-${index}`}
                                className="flex items-center justify-between gap-3 text-xs"
                            >
                                <div>
                                    <p className="font-medium capitalize">
                                        {item.product.replaceAll("_", " ")}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {formatCost(item.unit_price)}{billingUnitByProduct[item.product] ? `/${billingUnitByProduct[item.product]}` : ""}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="font-medium">{formatCost(item.cost)}</p>
                                    <p className="text-muted-foreground">
                                        {formatDuration(callCost.total_duration_seconds * 1000)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatCost(total)}</span>
                </div>
            </PopoverContent>
        </Popover>
    )
}
