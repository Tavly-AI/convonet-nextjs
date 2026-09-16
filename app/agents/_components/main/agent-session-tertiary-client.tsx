//optimize file
"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
    ConnectionState as ConnectionStateIndicator,
    ControlBar,
    LiveKitRoom,
    RoomAudioRenderer,
    useConnectionState,
    useRoomContext,
    useTranscriptions,
    useVoiceAssistant,
} from "@livekit/components-react"
import { ConnectionState } from "livekit-client"
import { LoaderCircle, MessageSquareText, Mic, Play, SendHorizontal, Square } from "lucide-react"

import { getAgentSession } from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type LiveKitConnection = {
    token: string
    url: string
    roomName: string
}

type TokenResponse = LiveKitConnection & {
    error?: string
}

export default function AgentSessionTertiaryClient() {
    const [connection, setConnection] = useState<LiveKitConnection | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    async function startTest() {
        const agentId = getAgentSession()?.id

        if (!agentId) {
            setError("Save the agent before testing it.")
            return
        }

        setError(null)
        setIsStarting(true)

        try {
            const response = await fetch("/api/livekit/create-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId }),
            })
            const body = (await response.json()) as TokenResponse

            if (!response.ok || !body.token || !body.url || !body.roomName) {
                throw new Error(body.error ?? "Failed to start the LiveKit test.")
            }

            setConnection({
                token: body.token,
                url: body.url,
                roomName: body.roomName,
            })
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to start the LiveKit test.")
        } finally {
            setIsStarting(false)
        }
    }

    if (!connection) {
        return (
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="space-y-1">
                    <Mic className="mx-auto size-5 text-muted-foreground" />
                    <p className="font-medium">Talk to the starter agent</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Starts a private LiveKit room and dispatches the temporary test worker.
                    </p>
                </div>
                <Button onClick={startTest} disabled={isStarting}>
                    {isStarting ? <LoaderCircle className="animate-spin" /> : <Play />}
                    {isStarting ? "Starting…" : "Start audio test"}
                </Button>
                {error ? <p className="max-w-sm text-sm text-destructive">{error}</p> : null}
            </div>
        )
    }

    return (
        <LiveKitRoom
            className="flex h-full min-h-56 flex-col gap-4 p-4"
            token={connection.token}
            serverUrl={connection.url}
            connect
            audio
            video={false}
            onDisconnected={() => setConnection(null)}
            onError={(error) => setError(error.message)}
        >
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="font-medium">Audio test</p>
                    <p className="text-xs text-muted-foreground">{connection.roomName}</p>
                </div>
                <ConnectionStateIndicator className="text-sm text-muted-foreground" />
            </div>

            <p className="text-sm text-muted-foreground">
                Allow microphone access, then start speaking. The agent response will play here.
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="mt-auto flex items-center justify-between gap-3">
                <ControlBar
                    variation="minimal"
                    controls={{ microphone: true, camera: false, screenShare: false, chat: false }}
                />
                <Button variant="outline" onClick={() => setConnection(null)}>
                    <Square />
                    End test
                </Button>
            </div>
            <RoomAudioRenderer />
        </LiveKitRoom>
    )
}

type ChatMessage = {
    id: string
    role: "agent" | "user"
    text: string
    timestamp: number
}

export function AgentSessionLlmClient() {
    const [connection, setConnection] = useState<LiveKitConnection | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    async function startTest() {
        const agentId = getAgentSession()?.id

        if (!agentId) {
            setError("Save the agent before testing it.")
            return
        }

        setError(null)
        setIsStarting(true)

        try {
            const response = await fetch("/api/livekit/create-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId }),
            })
            const body = (await response.json()) as TokenResponse

            if (!response.ok || !body.token || !body.url || !body.roomName) {
                throw new Error(body.error ?? "Failed to start the LiveKit test.")
            }

            setConnection({ token: body.token, url: body.url, roomName: body.roomName })
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to start the LiveKit test.")
        } finally {
            setIsStarting(false)
        }
    }

    if (!connection) {
        return (
            <div className="flex h-full min-h-56 flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="space-y-1">
                    <MessageSquareText className="mx-auto size-5 text-muted-foreground" />
                    <p className="font-medium">Test the agent by text</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        Starts a private room for an ephemeral text conversation with this agent.
                    </p>
                </div>
                <Button onClick={startTest} disabled={isStarting}>
                    {isStarting ? <LoaderCircle className="animate-spin" /> : <Play />}
                    {isStarting ? "Starting…" : "Start LLM test"}
                </Button>
                {error ? <p className="max-w-sm text-sm text-destructive">{error}</p> : null}
            </div>
        )
    }

    return (
        <LiveKitRoom
            className="flex h-full min-h-56 flex-col"
            token={connection.token}
            serverUrl={connection.url}
            connect
            audio={false}
            video={false}
            onDisconnected={() => setConnection(null)}
            onError={(nextError) => setError(nextError.message)}
        >
            <LlmConversation roomName={connection.roomName} error={error} onEnd={() => setConnection(null)} />
        </LiveKitRoom>
    )
}

function LlmConversation({ roomName, error, onEnd }: { roomName: string; error: string | null; onEnd: () => void }) {
    const room = useRoomContext()
    const connectionState = useConnectionState(room)
    const { agent } = useVoiceAssistant()
    const transcriptions = useTranscriptions({ room })
    const [draft, setDraft] = useState("")
    const [userMessages, setUserMessages] = useState<ChatMessage[]>([])
    const [isSending, setIsSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const latestRequestAt = useRef<number | null>(null)
    const transcriptEndRef = useRef<HTMLDivElement>(null)

    const agentMessages = useMemo<ChatMessage[]>(() => (
        transcriptions
            .filter((transcription) => transcription.participantInfo.identity !== room.localParticipant.identity)
            .map((transcription) => ({
                id: transcription.streamInfo.id,
                role: "agent",
                text: transcription.text,
                timestamp: transcription.streamInfo.timestamp,
            }))
    ), [room.localParticipant.identity, transcriptions])

    const messages = useMemo(
        () => [...userMessages, ...agentMessages].sort((left, right) => left.timestamp - right.timestamp),
        [agentMessages, userMessages]
    )

    useEffect(() => {
        const requestStartedAt = latestRequestAt.current
        if (requestStartedAt && agentMessages.some((message) => message.timestamp >= requestStartedAt)) {
            setIsSending(false)
            latestRequestAt.current = null
        }
    }, [agentMessages])

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ block: "end" })
    }, [messages])

    async function sendMessage(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const text = draft.trim()
        if (!text || isSending || connectionState !== ConnectionState.Connected || !agent) return

        const timestamp = Date.now()
        setSendError(null)
        setUserMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text, timestamp }])
        setDraft("")
        setIsSending(true)
        latestRequestAt.current = timestamp

        try {
            await room.localParticipant.sendText(text, { topic: "lk.chat" })
        } catch (sendError) {
            latestRequestAt.current = null
            setIsSending(false)
            setSendError(sendError instanceof Error ? sendError.message : "Failed to send the message.")
        }
    }

    const isConnected = connectionState === ConnectionState.Connected
    const isReady = isConnected && Boolean(agent)
    const composerDisabled = !isReady || isSending

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                    <p className="font-medium">LLM test</p>
                    <p className="text-xs text-muted-foreground">{roomName}</p>
                </div>
                <Button variant="outline" size="sm" onClick={onEnd}>
                    <Square />
                    End test
                </Button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                    <div className="flex h-full min-h-36 items-center justify-center text-center text-sm text-muted-foreground">
                        {isReady ? "Send a message to begin testing." : "Connecting to the agent…"}
                    </div>
                ) : messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn("flex flex-col gap-1", message.role === "user" ? "items-end" : "items-start")}
                    >
                        <span className="px-1 text-xs text-muted-foreground">
                            {message.role === "user" ? "You" : "Agent"}
                        </span>
                        <p
                            className={cn(
                                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                        >
                            {message.text}
                        </p>
                    </div>
                ))}
                {isSending ? <p className="text-xs text-muted-foreground">Agent is thinking…</p> : null}
                <div ref={transcriptEndRef} />
            </div>

            <form className="border-t p-3" onSubmit={sendMessage}>
                {error || sendError ? <p className="mb-2 text-sm text-destructive">{error ?? sendError}</p> : null}
                <div className="flex items-end gap-2">
                    <Textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault()
                                event.currentTarget.form?.requestSubmit()
                            }
                        }}
                        placeholder={isReady ? "Message the agent…" : "Connecting…"}
                        disabled={composerDisabled}
                        className="min-h-10 max-h-32 resize-none"
                        rows={1}
                    />
                    <Button type="submit" size="icon" disabled={!draft.trim() || composerDisabled} aria-label="Send message">
                        {isSending ? <LoaderCircle className="animate-spin" /> : <SendHorizontal />}
                    </Button>
                </div>
            </form>
        </div>
    )
}
