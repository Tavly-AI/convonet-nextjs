"use client"

import { HeadphonesIcon, MessageSquareIcon, MicIcon, PhoneIcon, PhoneOffIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { Room, RoomEvent, Track } from "livekit-client"
import { live_monitoring_endCall, live_monitoring_removeAgentFromSession } from "../_lib/live-monitoring-remove-agent-from-session"

export type LiveMonitoringRecord = {
    call_id: string
    agent_id: string | null
    start_timestamp: bigint | null
    duration_ms: number | null
    call_type: string | null
    from_number: string | null
    to_number: string | null
}
type Transcript = {
    id: string
    speaker: string
    text: string
    final: boolean
}

export function LiveMonitoringSidebarSheet({ record, onOpenChange }: { record: LiveMonitoringRecord, onOpenChange: (open: boolean) => void }) {
    const startedAt = record.start_timestamp ? new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(Number(record.start_timestamp))) : "—"
    const [transcripts, setTranscripts] = useState<Transcript[]>([])

    const roomRef = useRef<Room | null>(null)
    const audioContainerRef = useRef<HTMLDivElement>(null)
    const [connected, setConnected] = useState(false)
    const [listening, setListening] = useState(false)
    const [hasTakenOver, setHasTakenOver] = useState(false)
    const [pending, setPending] = useState<"listen" | "takeover" | "end" | null>(null)
    const [error, setError] = useState<string | null>(null)
    const preventClose = pending !== null || (hasTakenOver && connected)

    const onDisconnected = useEffectEvent(() => {
        setConnected(false)
        setListening(false)
        if (pending !== "end") setError("Disconnected from the call.")
    })

    useEffect(() => {
        let cancelled = false
        const room = new Room()
        const audioContainer = audioContainerRef.current

        roomRef.current = room

        async function connect() {
            try {
                const response = await fetch("/api/livekit/create-token/live-monitoring-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ callId: record.call_id }),
                })

                if (!response.ok) throw new Error("Failed to create monitoring token")

                const { token, url } = await response.json()

                if (cancelled) return

                // transcription
                room.on(RoomEvent.TranscriptionReceived, (segments, participant) => {
                    if (cancelled) return

                    setTranscripts(prev => {
                        const updated = new Map(prev.map(item => [item.id, item]))
                        for (const segment of segments) {
                            updated.set(segment.id, {
                                id: segment.id,
                                speaker: participant?.identity ?? "unknown",
                                text: segment.text,
                                final: segment.final,
                            })
                        }
                        return [...updated.values()]
                    })
                })

                // audio
                room.on(RoomEvent.TrackSubscribed, (track) => {
                    if (track.kind !== Track.Kind.Audio) return

                    const element = track.attach()
                    element.autoplay = true
                    audioContainer?.appendChild(element)
                })

                room.on(RoomEvent.TrackUnsubscribed, (track) => { track.detach().forEach(element => element.remove()) })

                room.on(RoomEvent.Disconnected, () => { if (!cancelled) onDisconnected() })

                await room.connect(url, token, { autoSubscribe: false })

                if (cancelled) { await room.disconnect(); return }

                setConnected(true)
            } catch (error) {
                if (!cancelled) { setError(error instanceof Error ? error.message : "Connection failed") }
            }
        }

        void connect()

        return () => {
            cancelled = true

            // audio
            audioContainer?.replaceChildren()

            roomRef.current = null
            void room.disconnect()
        }
    }, [record.call_id])

    async function set_live_listening(room: Room, enabled: boolean) {
        if (enabled) await room.startAudio()
        room.remoteParticipants.forEach(participant => { participant.audioTrackPublications.forEach(track => track.setSubscribed(enabled)) })
        setListening(enabled)
    }

    async function manage_live_listen() {
        const room = roomRef.current
        if (!room || !connected || pending) return
        setPending("listen")
        setError(null)
        try {
            await set_live_listening(room, !listening)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to start audio playback")
        } finally {
            setPending(null)
        }
    }

    async function manage_take_over() {
        const room = roomRef.current
        if (!room || !connected || pending) return
        setPending("takeover")
        setError(null)
        try {
            await set_live_listening(room, true)
            await room.localParticipant.setMicrophoneEnabled(true)
            await live_monitoring_removeAgentFromSession(record.call_id)
            setHasTakenOver(true)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to join call")
        } finally {
            setPending(null)
        }
    }

    async function manage_end_call() {
        if (pending) return
        setPending("end")
        setError(null)
        try {
            await live_monitoring_endCall(record.call_id)
            onOpenChange(false)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Unable to end the call. Please try again.")
        } finally {
            setPending(null)
        }
    }

    return (
        <Sheet open onOpenChange={(open, details) => {
            if (!open && preventClose) {
                details.cancel()
                return
            }
            onOpenChange(open)
        }}>
            <SheetContent showCloseButton={!preventClose} className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
                <SheetHeader className="gap-3 border-b p-6 pr-14">
                    <SheetTitle className="flex items-center gap-2">
                        <PhoneIcon className="size-4 shrink-0" />
                        {startedAt} · {record.call_type?.replaceAll("_", " ") ?? "Voice call"}
                    </SheetTitle>
                    <Badge variant="outline" className="w-fit gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" />Ongoing</Badge>
                    <SheetDescription className="space-y-1 break-all">
                        <span className="block">Agent: {record.agent_id ?? "—"}</span>
                        <span className="block">Call ID: {record.call_id}</span>
                        <span className="block">Phone Call: {record.from_number ?? "—"} → {record.to_number ?? "—"}</span>
                    </SheetDescription>
                </SheetHeader>
                <section className="flex min-h-0 flex-1 flex-col p-6">
                    <h2 className="border-b pb-3 text-sm font-medium">Transcription</h2>

                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4">
                        {transcripts.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                                <MessageSquareIcon className="size-8 opacity-50" />
                                <p className="text-sm">
                                    {hasTakenOver ? "No transcript available before takeover." : connected
                                        ? "Waiting for live transcription..."
                                        : error ?? "Connecting to live call..."}
                                </p>
                            </div>
                        ) : (
                            transcripts.map(transcript => (
                                <div key={transcript.id} className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {transcript.speaker}
                                    </p>

                                    <p className={`text-sm ${!transcript.final ? "opacity-60" : ""}`}>
                                        {transcript.text}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </section>
                <SheetFooter className="gap-3 border-t bg-muted/20 p-6">
                    <div ref={audioContainerRef} className="hidden" />
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    {hasTakenOver ? (
                        <>
                            <p className="text-xs text-muted-foreground">Live transcription stopped when you took over.</p>
                            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                <MicIcon className="size-4" />
                                You’ve taken over the call
                            </div>
                            <p className="break-all text-sm">{record.from_number ?? record.to_number ?? "Customer"} &amp; You</p>
                            <Button variant="destructive" className="w-full" disabled={pending !== null} onClick={manage_end_call}>
                                <PhoneOffIcon />
                                {pending === "end" ? "Ending…" : "End Call"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="break-all text-sm">{record.from_number ?? "Caller"} &amp; AI agent</p>
                            <div className="flex gap-2">
                                <Button
                                    variant={listening ? "default" : "outline"}
                                    className="flex-1"
                                    disabled={!connected || pending !== null}
                                    onClick={manage_live_listen}
                                >
                                    <HeadphonesIcon />
                                    {listening ? "Stop Listening" : "Live Listen"}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    disabled={!connected || pending !== null}
                                    onClick={manage_take_over}
                                >
                                    <PhoneIcon />
                                    {pending === "takeover" ? "Joining..." : "Take Over"}
                                </Button>
                            </div>
                        </>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
