"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"

import type { BeginMessageSettings } from "@/app/agents/_lib/session-storage/agent-session"
import {
    getBeginMessageSettings,
    writeBeginMessageSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export function AgentSessionStartSpeaker() {

    const searchParams = useSearchParams()
    if (searchParams.get("channel") === "chat") return null

    const [settings, setSettings] = React.useState(getBeginMessageSettings);

    function updateSettings(patch: Partial<BeginMessageSettings>) {
        const nextSettings = { ...settings, ...patch }
        setSettings(nextSettings)
        writeBeginMessageSettings(patch)
    }

    const timingSetting = settings.start_speaker === "user"
        ? {
            id: "begin-after-user-silence",
            label: "Start after user silence (seconds)",
            seconds: settings.begin_after_user_silence_ms / 1000,
            update: (seconds: number) => updateSettings({ begin_after_user_silence_ms: Math.round(seconds * 1000) }),
        }
        : {
            id: "begin-message-delay",
            label: "Opening delay (seconds)",
            seconds: settings.begin_message_delay_ms / 1000,
            update: (seconds: number) => updateSettings({ begin_message_delay_ms: Math.round(seconds * 1000) }),
        }

    return (
        <section className="mt-4 space-y-4 rounded-xl border p-4">
            <div>
                <h2 className="font-medium">Conversation start</h2>
                <p className="text-sm text-muted-foreground">
                    Configure who starts the call, when the agent begins, and the opening message.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="start-speaker">Who speaks first?</Label>
                    <Select
                        value={settings.start_speaker}
                        onValueChange={(value) => {
                            if (value === "user" || value === "agent") {
                                updateSettings({ start_speaker: value })
                            }
                        }}
                    >
                        <SelectTrigger id="start-speaker" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <Label className="leading-normal">{timingSetting.label}</Label>
                        <Badge variant="secondary" className="shrink-0 font-mono">
                            {timingSetting.seconds.toFixed(1)} s
                        </Badge>
                    </div>
                    <Slider
                        aria-label={timingSetting.label}
                        value={timingSetting.seconds}
                        min={0}
                        max={10}
                        step={0.1}
                        onValueChange={(nextValue) => {
                            const seconds = Array.isArray(nextValue) ? nextValue[0] : nextValue
                            timingSetting.update(Number(seconds.toFixed(1)))
                        }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 s</span>
                        <span>10 s</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="begin-message">Opening message</Label>
                <Textarea
                    id="begin-message"
                    value={settings.begin_message}
                    onChange={(event) => updateSettings({ begin_message: event.target.value })}
                    placeholder="Hello, how can I help you today?"
                    className="min-h-24 resize-y"
                />
            </div>
        </section>
    )
}
