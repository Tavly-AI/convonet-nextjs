"use client"

import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { BookOpenIcon, HeadphonesIcon, PhoneIcon, WrenchIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { callHistoryGetCallStatus } from "./call-history-table-client"

export function CallHistorySidebar({ record, onOpenChange }: { record: CallRecordDatabaseData, onOpenChange: (open: boolean) => void }) {

    // derive some stuff for ui
    const startedAt = record.start_timestamp ? new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(Number(record.start_timestamp))) : "—"
    const callStatus = callHistoryGetCallStatus(record.call_status)

    return (
        <Sheet open onOpenChange={onOpenChange}>
            <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-3xl min-w-2xl">
                <SheetHeader className="border-b p-6 pr-14">
                    <div className="flex flex-wrap items-center gap-3">
                        <SheetTitle className="flex items-center gap-2 text-2xl"><PhoneIcon className="size-5" />{startedAt} · {record.call_type?.replace("_", " ")}</SheetTitle>
                        <Badge variant={callStatus.variant}>{callStatus.label}</Badge>
                    </div>
                    <SheetDescription className="space-y-1"><span className="block">Agent: {record.agent_id}</span><span className="block">Call ID: {record.call_id}</span></SheetDescription>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 mb-3 text-sm text-muted-foreground"><span>Duration: {Math.floor((record.duration_ms ?? 0) / 60000)}m {Math.floor(((record.duration_ms ?? 0) % 60000) / 1000)}s</span><span>Cost: $${record.call_cost?.combined_cost?.toFixed(2) ?? "—"}</span><span>LLM tokens: {record.llm_token_usage?.average ?? "—"}</span></div>
                    <PlayAudio url={record.recording_multi_channel_url} />
                </SheetHeader>
                <section className="space-y-4 border-b p-6">
                    <h2 className="text-xl font-medium">Conversation analysis</h2>
                    <div className="grid gap-3 text-sm sm:grid-cols-1">
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Call successful</span><Badge variant={record.call_analysis?.call_successful ? "secondary" : "destructive"}>{record.call_analysis?.call_successful ? "Successful" : "Unsuccessful"}</Badge></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">Call status</span><span>{record.call_status}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">User sentiment</span><span>{record.call_analysis?.user_sentiment}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">E2E latency</span><span>{record.latency?.e2e?.num ? `${record.latency.e2e.p50}ms` : "—"}</span></div>
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">End reason</span><span>{record.disconnection_reason?.replaceAll("_", " ")}</span></div>
                    </div>
                </section>
                <section className="space-y-3 border-b p-6"><h2 className="text-xl font-medium">Summary</h2><p className="max-w-4xl leading-7 text-muted-foreground">{record.call_analysis?.call_summary}</p></section>
                {record.call_analysis && Object.keys(record.call_analysis.custom_analysis_data).length > 0 && (
                    <section className="space-y-3 border-b p-6">
                        <h2 className="text-xl font-medium">Collected data</h2>
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                            {Object.entries(record.call_analysis.custom_analysis_data).map(([name, value]) => (
                                <div key={name} className="space-y-1">
                                    <dt className="text-muted-foreground">{name.replaceAll("_", " ")}</dt>
                                    <dd>{value === null ? "—" : typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}
                <Tabs defaultValue="transcript" className="gap-0">
                    <TabsList variant="line" className="h-14 w-full justify-start gap-5 border-b px-6"><TabsTrigger value="transcript">Transcription</TabsTrigger><TabsTrigger value="data">Data</TabsTrigger></TabsList>
                    <TabsContent value="transcript" className="space-y-4 p-6">
                        <TranscriptView timeline={record.transcript_with_tool_calls} url={record.recording_multi_channel_url} />
                    </TabsContent>
                    <TabsContent value="data" className="space-y-4 p-6"><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-1 text-muted-foreground">Dynamic variables</p><pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(record.retell_llm_dynamic_variables, null, 2)}</pre></div><div><p className="mb-1 text-muted-foreground">Collected variables</p><pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(record.collected_dynamic_variables, null, 2)}</pre></div></div></TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}


export function PlayAudio({ url }: { url?: string | null }) {
    const [audioUrl, setAudioUrl] = useState<string>()

    async function play() {
        if (!url) return

        const res = await fetch(`/api/aws/presigned-s3?url=${encodeURIComponent(url)}`)

        const data = await res.json()
        setAudioUrl(data.url)
    }

    if (audioUrl) return <audio src={audioUrl} controls autoPlay />

    return (
        <Button variant="outline" className="mt-5 w-80" onClick={play} disabled={!url}>
            <HeadphonesIcon />
            Listen to recording
        </Button>
    )
}

function TranscriptView({ timeline, url }: { timeline: CallRecordDatabaseData["transcript_with_tool_calls"], url?: string | null }) {
    if (!timeline?.length) return <p className="text-sm text-muted-foreground">No transcript available.</p>

    return (
        <div className="space-y-4">
            {timeline.map((message, index) => message.type !== "message" ? (
                <TranscriptMessageButTool key={`${message.type}-${message.call_id}-${index}`} event={message} />
            ) : (
                <TranscriptMessageOnlySimple key={index} message={message} url={url} />
            ))}
        </div>
    )
}

// MISC CODE


// note: add audio_recording_started_at: null 
// to complete the feature
async function playThatAudio(recordingUrl: string | null | undefined, start: number) {

    if (!recordingUrl) return
    const res = await fetch(`/api/aws/presigned-s3?url=${encodeURIComponent(recordingUrl)}`)

    const data = await res.json()
    const audio = new Audio(data.url)

    audio.addEventListener(
        "loadedmetadata",
        () => {
            audio.currentTime = start / 1000
            void audio.play()
        },
        { once: true }
    )
}

// transscript-messages with tool-call
function TranscriptMessageButTool({ event }: { event: Exclude<NonNullable<CallRecordDatabaseData["transcript_with_tool_calls"]>[number], { type: "message" }> }) {
    const isResult = event.type === "function_call_output"
    const isKnowledgeBase = event.name === "search_knowledge_base"
    const raw = isResult ? event.output : event.arguments
    let formatted = raw
    let resultReportsError = false
    try {
        const parsed: unknown = JSON.parse(raw)
        formatted = JSON.stringify(parsed, null, 2)
        resultReportsError = !!parsed && typeof parsed === "object" && "status" in parsed && parsed.status === "error"
    } catch {
        // Tool output can be plain text rather than JSON.
    }
    const isError = isResult && (event.is_error || resultReportsError)
    const Icon = isKnowledgeBase ? BookOpenIcon : WrenchIcon

    return (
        <details className="group rounded-lg border border-dashed bg-muted/30">
            <summary className="cursor-pointer p-4 text-sm marker:text-muted-foreground">
                <span className="ml-1 inline-flex max-w-full flex-wrap items-center gap-2 align-middle">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{isKnowledgeBase ? "Knowledge base search" : event.name}</span>
                    <Badge variant={isError ? "destructive" : "outline"}>{isResult ? (isError ? "Error" : "Result") : "Called"}</Badge>
                </span>
            </summary>
            <div className="space-y-3 border-t p-4 text-sm">
                <div className="break-all text-xs text-muted-foreground">{event.name} · {event.call_id}</div>
                <div className="font-medium">{isResult ? "Output" : "Arguments"}</div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">{formatted || "(empty)"}</pre>
            </div>
        </details>
    )
}

// transscript-messages without tool-call
function TranscriptMessageOnlySimple({ message, url }: { message: NonNullable<CallRecordDatabaseData["transcript_object"]>[number], url?: string | null }) {
    return (
        <div
            onClick={() => playThatAudio(url, message.start_timestamp)}
            className="cursor-pointer rounded-lg bg-muted p-4 leading-6"
        >
            <div className="mb-1 text-xs font-medium text-muted-foreground">
                {message.role}
            </div>
            <div className="whitespace-pre-wrap break-words">
                {message.content}
            </div>
        </div>
    )
}