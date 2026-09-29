"use client"

import { useState } from "react"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import {
    formatDateTime,
    formatDuration,
    getMessageCount,
    getSentimentTone,
    getSessionOutcome,
    getSessionStatusTone,
    getUserSentiment,
    HistoryStatusValue,
} from "./chat-history-utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { ChatHistorySidebar } from "./chat-history-sidebar"

export function ChatHistoryTableClient({ chatRecords }: { chatRecords: CallRecordDatabaseData[] }) {
    const [selectedRecord, setSelectedRecord] = useState<CallRecordDatabaseData | null>(null)
    const { state: sidebarState, isMobile } = useSidebar()

    return (
        <section className={cn(
            "m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6",
            !isMobile && sidebarState === "expanded" && "max-w-[calc(100vw-var(--sidebar-width)-2rem)]",
        )}>
            <div><h1 className="text-xl font-semibold tracking-tight">Chat history</h1><p className="text-sm text-muted-foreground">Review conversations handled by your chat agents.</p></div>
            <div className="flex min-h-0 flex-1 flex-col gap-5 xl:flex-row">
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border">
                    <Table className="min-w-[1100px]">
                        <TableHeader className="bg-muted/60"><TableRow className="hover:bg-transparent"><TableHead className="h-12 pl-4">Time</TableHead><TableHead>Agent</TableHead><TableHead>Messages</TableHead><TableHead>Duration</TableHead><TableHead>Session Status</TableHead><TableHead>User Sentiment</TableHead><TableHead className="pr-4">Session Outcome</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {chatRecords.map((record) => {
                                const sentiment = getUserSentiment(record.call_analysis)
                                const outcome = getSessionOutcome(record.call_analysis)

                                return <TableRow key={record.call_id} onClick={() => setSelectedRecord(record)} className="cursor-pointer">
                                    <TableCell className="h-14 pl-4 font-medium">{formatDateTime(record.start_timestamp)}</TableCell>
                                    <TableCell>{record.agent_id ?? "—"}</TableCell>
                                    <TableCell>{getMessageCount(record.transcript_object)}</TableCell>
                                    <TableCell>{formatDuration(record.duration_ms)}</TableCell>
                                    <TableCell><HistoryStatusValue label={record.call_status.replaceAll("_", " ")} tone={getSessionStatusTone(record.call_status)} /></TableCell>
                                    <TableCell><HistoryStatusValue label={sentiment} tone={getSentimentTone(sentiment)} /></TableCell>
                                    <TableCell className="pr-4"><HistoryStatusValue label={outcome.label} tone={outcome.tone} /></TableCell>
                                </TableRow>
                            })}
                            {chatRecords.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No chats yet.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
                {selectedRecord && <ChatHistorySidebar record={selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)} />}
            </div>
        </section>
    )
}
