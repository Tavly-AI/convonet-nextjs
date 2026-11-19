"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LiveMonitoringSidebarSheet, type LiveMonitoringRecord } from "./live-monitoring-sidebar-sheet"

export function LiveMonitoringTableClient({ callRecords }: { callRecords: LiveMonitoringRecord[] }) {
    const [selectedRecord, setSelectedRecord] = useState<LiveMonitoringRecord | null>(null)

    return (
        <section className="m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6">
            <h1 className="text-xl font-semibold tracking-tight">Live Monitoring</h1>
            <div className="min-w-0 overflow-hidden rounded-xl border">
                <Table>
                    <TableHeader className="bg-muted/60">
                        <TableRow className="hover:bg-transparent">
                            {["Time", "Call Duration", "Type", "From", "To", "Call ID"].map(title => (
                                <TableHead key={title} className="h-12 first:pl-4 last:pr-4">{title}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {callRecords.map((record) => (
                            <TableRow key={record.call_id} className="cursor-pointer" onClick={() => setSelectedRecord(record)}>
                                <TableCell className="h-14 pl-4 font-medium">{formatDateTime(record.start_timestamp)}</TableCell>
                                <TableCell>{formatDuration(record.duration_ms)}</TableCell>
                                <TableCell>{record.call_type === "webrtc" ? "web_call" : record.call_type ?? "—"}</TableCell>
                                <TableCell>{record.from_number ?? "—"}</TableCell>
                                <TableCell>{record.to_number ?? "—"}</TableCell>
                                <TableCell className="pr-4">
                                    <Button variant="link" className="h-auto p-0 font-normal" aria-label={`Monitor call ${record.call_id}`} onClick={() => setSelectedRecord(record)}>
                                        {record.call_id}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {callRecords.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No ongoing calls.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
            {selectedRecord && <LiveMonitoringSidebarSheet record={selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)} />}
        </section>
    )
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
