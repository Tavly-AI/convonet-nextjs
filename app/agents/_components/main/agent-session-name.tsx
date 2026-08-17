"use client"

import { useEffect, useState } from "react"

import {
    getAgentName,
    writeAgentName,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export function AgentSessionName() {
    const [name, setName] = useState("Untitled Agent")

    useEffect(() => {
        setName(getAgentName())
    }, [])

    function handleChange(value: string) {
        setName(value)
        writeAgentName(value)
    }

    return (
        <div className="flex items-center gap-3">
            <Button
                variant="outline"
                size="icon"
                onClick={() => { window.location.href = "/dashboard/agents" }}
                className="size-9 rounded-xl"
            >
                <ChevronLeft className="size-5" />
                <span className="sr-only">Go back</span>
            </Button>
            <Input
                value={name}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Agent name"
                className="
                h-8 w-52
                border-transparent
                bg-transparent
                px-2
                shadow-none
                hover:border-border
                focus-visible:border-border
                focus-visible:ring-1
            "
            />
        </div>
    )
}