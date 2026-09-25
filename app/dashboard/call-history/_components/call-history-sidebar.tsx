"use client"

import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import type { CallRecord } from "@/generated/prisma/client"
import { HeadphonesIcon, PhoneIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { callHistoryGetCallStatus } from "./call-history-table-client"

type CallHistoryRecord = CallRecordDatabaseData & {
    telephony_identifier?: { twilio_call_sid: string }
    agent_name?: string
    agent_tag?: string
    scrubbed_recording_url?: string
    scrubbed_recording_multi_channel_url?: string
}

export function CallHistorySidebar({ record: inputRecord, onOpenChange }: { record: CallHistoryRecord | CallRecord, onOpenChange: (open: boolean) => void }) {
    const record = inputRecord as CallHistoryRecord

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
                        <div className="flex items-center justify-between"><span className="text-muted-foreground">End reason</span><span>{record.disconnection_reason?.replaceAll("_", " ")}</span></div>
                    </div>
                </section>
                <section className="space-y-3 border-b p-6"><h2 className="text-xl font-medium">Summary</h2><p className="max-w-4xl leading-7 text-muted-foreground">{record.call_analysis?.call_summary}</p></section>
                <Tabs defaultValue="transcript" className="gap-0">
                    <TabsList variant="line" className="h-14 w-full justify-start gap-5 border-b px-6"><TabsTrigger value="transcript">Transcription</TabsTrigger><TabsTrigger value="data">Data</TabsTrigger></TabsList>
                    <TabsContent value="transcript" className="space-y-4 p-6">
                        <TranscriptView transcriptObject={record.transcript_object} url={record.recording_multi_channel_url} />
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

function TranscriptView({ transcriptObject, url }: { transcriptObject?: CallRecordDatabaseData["transcript_object"], url?: string | null }) {

    const messages = transcriptObject ?? []

    return (
        <div className="space-y-4">
            {messages.map((message, index) => (
                <div
                    key={index}
                    onClick={() => playThatAudio(url, message.start_timestamp)}
                    className="cursor-pointer rounded-lg bg-muted p-4 leading-6"
                >
                    <div className="mb-1 text-xs font-medium text-muted-foreground">
                        {message.role}
                    </div>

                    <div>{message.content}</div>
                </div>
            ))}
        </div>
    )
}

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
