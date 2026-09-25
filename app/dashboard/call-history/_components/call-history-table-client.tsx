"use client"

import { useState } from "react"
import type { CallRecord } from "@/generated/prisma/client"
import { PhoneIncomingIcon, PhoneOutgoingIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CallHistorySidebar } from "./call-history-sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"

export function CallHistoryTableClient({ callRecords }: { callRecords: CallRecord[] }) {
    const [selectedRecord, setSelectedRecord] = useState<CallRecord | null>(null)

    return (
        <section className="m-4 flex min-h-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6">
            <div><h1 className="text-xl font-semibold tracking-tight">Call history</h1><p className="text-sm text-muted-foreground">Review calls made and received by your agents.</p></div>
            <div className="flex min-h-0 flex-1 flex-col gap-5 xl:flex-row">
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
                    <Table>
                        <TableHeader className="bg-muted/60"><TableRow className="hover:bg-transparent"><TableHead className="h-12 pl-4">Contact</TableHead><TableHead>Direction</TableHead><TableHead>Agent</TableHead><TableHead>Duration</TableHead><TableHead>Status</TableHead><TableHead>Sentiment</TableHead><TableHead className="pr-4">Started</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {callRecords.map((record) => {
                                const isInbound = record.direction === "inbound"
                                const contact = isInbound ? record.from_number : record.to_number
                                const duration = record.duration_ms ? `${Math.floor(record.duration_ms / 60000)}m ${Math.floor((record.duration_ms % 60000) / 1000)}s` : "—"
                                const startedAt = record.start_timestamp ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(Number(record.start_timestamp))) : "—"
                                const sentiment = getUserSentiment(record.call_analysis)

                                return <TableRow key={record.call_id} onClick={() => setSelectedRecord(record)} className="cursor-pointer">
                                    <TableCell className="h-14 pl-4 font-medium"><div className="flex flex-col gap-0.5"><span>{contact ?? "Web caller"}</span><span className="font-normal text-xs text-muted-foreground">{record.call_type === "webrtc" ? "Web call" : "Phone call"}</span></div></TableCell>
                                    <TableCell><div className="flex items-center gap-2 text-muted-foreground">{isInbound ? <PhoneIncomingIcon className="size-4" /> : <PhoneOutgoingIcon className="size-4" />}<span>{isInbound ? "Inbound" : "Outbound"}</span></div></TableCell>
                                    <TableCell>{record.agent_id ?? "—"}</TableCell><TableCell>{duration}</TableCell>
                                    <TableCell>
                                        <Badge variant={callHistoryGetCallStatus(record.call_status).variant}>
                                            {callHistoryGetCallStatus(record.call_status).label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><Badge variant="outline" className={getSentimentBadgeClass(sentiment)}>{sentiment}</Badge></TableCell><TableCell className="pr-4 text-muted-foreground">{startedAt}</TableCell>
                                </TableRow>
                            })}
                            {callRecords.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No calls yet.</TableCell></TableRow>}
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

function getSentimentBadgeClass(sentiment: string) {
    switch (sentiment.toLowerCase()) {
        case "positive": return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
        case "negative": return "border-destructive/30 bg-destructive/10 text-destructive"
        case "neutral": return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
        default: return "text-muted-foreground"
    }
}


export function callHistoryGetCallStatus(status: string | null | undefined): {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
} {
    switch (status as CallRecordDatabaseData["call_status"]) {
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
