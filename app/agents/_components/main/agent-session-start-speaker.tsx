"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ChevronRight, Clock3, Info } from "lucide-react"

import type { BeginMessageSettings } from "@/app/agents/_lib/session-storage/agent-session"
import {
    getBeginMessageSettings,
    writeBeginMessageSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Label } from "@/components/ui/label"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"

export function isChatAgentSession(searchParams: Pick<URLSearchParams, "get">): boolean {
    return searchParams.get("channel") === "chat"
}

export function AgentSessionStartSpeaker() {

    const searchParams = useSearchParams()
    const isChat = isChatAgentSession(searchParams)
    const [settings, setSettings] = React.useState(getBeginMessageSettings)
    const isDynamic = settings.begin_message == null
    const staticMessage = React.useRef(settings.begin_message ?? "")

    function updateSettings(patch: Partial<BeginMessageSettings>) {
        const nextSettings = { ...settings, ...patch }
        setSettings(nextSettings)
        writeBeginMessageSettings(patch)
    }

    const timingSetting = settings.start_speaker === "user"
        ? {
            id: "begin-after-user-silence",
            label: "Start after user silence (seconds)",
            seconds: (settings.begin_after_user_silence_ms ?? 2000) / 1000,
            update: (seconds: number) => updateSettings({ begin_after_user_silence_ms: Math.round(seconds * 1000) }),
        }
        : {
            id: "begin-message-delay",
            label: "Opening delay (seconds)",
            seconds: settings.begin_message_delay_ms / 1000,
            update: (seconds: number) => updateSettings({ begin_message_delay_ms: Math.round(seconds * 1000) }),
        }

    return (
        <section className="mt-4 space-y-3">
            <Label htmlFor="start-speaker" className="text-base font-medium">Welcome message</Label>

            <WebsiteCustomDropdown
                id="start-speaker"
                label="Starting speaker"
                value={settings.start_speaker}
                onValueChange={(value) => {
                    if (value === "user" || value === "agent") {
                        updateSettings({ start_speaker: value })
                    }
                }}
                options={[
                    ...(!isChat ? [{ value: "user", label: "User speaks first" }] : []),
                    { value: "agent", label: "AI speaks first" },
                ]}
            />

            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 pt-1">
                <div className={settings.start_speaker === "user" ? "flex items-center gap-2" : "hidden"}>
                    <span className="text-sm font-medium">AI starts speaking after silence</span>
                    <Info className="size-4 text-muted-foreground" aria-label="The AI waits for user silence before speaking" />
                    <Toggle
                        pressed={settings.begin_after_user_silence_ms != null}
                        onPressedChange={(pressed) => updateSettings({ begin_after_user_silence_ms: pressed ? 2000 : null })}
                        aria-label="AI starts speaking after silence"
                        className="h-5 w-8 justify-start rounded-full border bg-muted p-0.5 hover:bg-muted aria-pressed:justify-end aria-pressed:border-primary aria-pressed:bg-primary"
                    >
                        <span className="size-4 rounded-full bg-background shadow-sm" />
                    </Toggle>
                </div>

                <Popover>
                    <PopoverTrigger
                        disabled={settings.start_speaker === "user" && settings.begin_after_user_silence_ms == null}
                        render={
                            <button
                                type="button"
                                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            />
                        }
                    >
                        <Clock3 className="size-4" />
                        <span>{settings.start_speaker === "user" ? "Silence time" : "Pause before speaking"}: {timingSetting.seconds.toFixed(1)}s</span>
                        <ChevronRight className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent side="top" align="end" className="w-80 gap-3 p-4">
                        <PopoverHeader>
                            <PopoverTitle>{settings.start_speaker === "user" ? "Silence time" : "Pause before speaking"}</PopoverTitle>
                            <PopoverDescription>
                                {settings.start_speaker === "user"
                                    ? "The delay after user silence before the assistant begins speaking."
                                    : "The duration before the assistant starts speaking at the beginning of the call."}
                            </PopoverDescription>
                        </PopoverHeader>
                        <div className="flex items-center gap-4">
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
                            <span className="w-10 text-right text-base tabular-nums text-muted-foreground">
                                {timingSetting.seconds.toFixed(1)}s
                            </span>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className={settings.start_speaker === "agent" ? "space-y-2 pt-1" : "hidden"}>
                <Label htmlFor="opening-message-type" className="sr-only">Opening message type</Label>
                <WebsiteCustomDropdown
                    id="opening-message-type"
                    label="Opening message type"
                    value={isDynamic ? "dynamic" : "static"}
                    onValueChange={(value) => {
                        if (value !== "static" && value !== "dynamic") return
                        staticMessage.current = settings.begin_message ?? staticMessage.current
                        updateSettings({ begin_message: value === "dynamic" ? null : staticMessage.current })
                    }}
                    options={[
                        { value: "static", label: "Static message" },
                        { value: "dynamic", label: "Dynamic message" },
                    ]}
                />
                <Textarea
                    id="begin-message"
                    value={settings.begin_message ?? ""}
                    disabled={isDynamic}
                    onChange={(event) => updateSettings({ begin_message: event.target.value })}
                    aria-label="Opening message"
                    placeholder={isDynamic
                        ? "AI generates the greeting from the general prompt."
                        : "Hello, how can I help you today?"}
                    className="min-h-24 resize-y"
                />
            </div>
        </section>
    )
}
