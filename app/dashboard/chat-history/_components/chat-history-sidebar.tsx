"use client"

import { MessageSquareTextIcon } from "lucide-react"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { formatDateTime, formatDuration, getSessionStatus } from "./chat-history-utils"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ChatHistorySidebar({ record, onOpenChange }: { record: CallRecordDatabaseData; onOpenChange: (open: boolean) => void }) {
    const sessionStatus = getSessionStatus(record.call_status)
    const analysis = record.call_analysis

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-3xl min-w-2xl">
                <SheetHeader className="border-b p-6 pr-14">
                    <div className="flex flex-wrap items-center gap-3">
                        <SheetTitle className="flex items-center gap-2 text-2xl"><MessageSquareTextIcon className="size-5" />{formatDateTime(record.start_timestamp)}</SheetTitle>
                        <Badge variant={sessionStatus.variant}>{sessionStatus.label}</Badge>
                    </div>
                    <SheetDescription className="space-y-1"><span className="block">Agent: {record.agent_id ?? "—"}</span><span className="block">Session ID: {record.call_id}</span></SheetDescription>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground"><span>Duration: {formatDuration(record.duration_ms)}</span><span>Messages: {record.transcript_object?.length ?? 0}</span></div>
                </SheetHeader>
                <section className="space-y-4 border-b p-6">
                    <h2 className="text-xl font-medium">Conversation analysis</h2>
                    <div className="grid gap-3 text-sm sm:grid-cols-1">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Session outcome</span><Badge variant={analysis?.call_successful ? "secondary" : "destructive"}>{analysis ? analysis.call_successful ? "Successful" : "Unsuccessful" : "—"}</Badge></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Session status</span><span>{sessionStatus.label}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">User sentiment</span><span>{analysis?.user_sentiment ?? "—"}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">E2E latency</span><span>{record.latency?.e2e?.num ? `${record.latency.e2e.p50}ms` : "—"}</span></div>
                    </div>
                </section>
                <section className="space-y-3 border-b p-6"><h2 className="text-xl font-medium">Summary</h2><p className="max-w-4xl leading-7 text-muted-foreground">{analysis?.call_summary ?? "—"}</p></section>
                {analysis && Object.keys(analysis.custom_analysis_data).length > 0 && (
                    <section className="space-y-3 border-b p-6">
                        <h2 className="text-xl font-medium">Collected data</h2>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            {Object.entries(analysis.custom_analysis_data).map(([name, value]) => <div key={name} className="space-y-1"><dt className="text-muted-foreground">{name.replaceAll("_", " ")}</dt><dd>{value === null ? "—" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}
                        </dl>
                    </section>
                )}
                <Tabs defaultValue="transcript" className="gap-0">
                    <TabsList variant="line" className="h-14 w-full justify-start gap-5 border-b px-6"><TabsTrigger value="transcript">Transcript</TabsTrigger><TabsTrigger value="data">Data</TabsTrigger></TabsList>
                    <TabsContent value="transcript" className="space-y-4 p-6">
                        {record.transcript_object?.length ? record.transcript_object.map((message, index) => <div key={`${message.start_timestamp}-${index}`} className="rounded-lg bg-muted p-4 leading-6"><div className="mb-1 text-xs font-medium text-muted-foreground">{message.role === "assistant" ? "Agent" : message.role}</div><div className="whitespace-pre-wrap">{message.content}</div></div>) : <p className="text-sm text-muted-foreground">No transcript available.</p>}
                    </TabsContent>
                    <TabsContent value="data" className="space-y-4 p-6"><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-1 text-muted-foreground">Dynamic variables</p><pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(record.retell_llm_dynamic_variables, null, 2)}</pre></div><div><p className="mb-1 text-muted-foreground">Collected variables</p><pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(record.collected_dynamic_variables, null, 2)}</pre></div></div></TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
