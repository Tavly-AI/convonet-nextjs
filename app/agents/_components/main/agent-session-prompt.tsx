"use client"

import * as React from "react"

import {
    getGeneralPrompt,
    writeGeneralPrompt,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Textarea } from "@/components/ui/textarea"

const PLACEHOLDER =
    "Describe the agent's role, tone, rules, and conversation flow..."

export function GeneralPrompt() {
    const [prompt, setPrompt] = React.useState(getGeneralPrompt)

    React.useEffect(() => {
        const timeout = setTimeout(() => writeGeneralPrompt(prompt), 500)
        return () => clearTimeout(timeout)
    }, [prompt])

    return (
        <Textarea
            value={prompt}
            onChange={event => setPrompt(event.target.value)}
            placeholder={PLACEHOLDER}
            className="min-h-[28rem] flex-1 resize-none border-muted-foreground/20 p-4 leading-6 shadow-none"
        />
    )
}