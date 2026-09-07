"use client"

import * as React from "react"

import {
    getHandbookConfig,
    type HandbookConfig,
    writeHandbookConfig,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const HANDBOOK_OPTIONS: Array<{
    key: keyof HandbookConfig
    label: string
    description: string
}> = [
    { key: "default_personality", label: "Default personality", description: "Use a warm, helpful baseline personality." },
    { key: "conversational_personality", label: "Conversational personality", description: "Keep responses natural and easy to follow." },
    { key: "natural_filler_words", label: "Natural filler words", description: "Allow occasional conversational fillers." },
    { key: "high_empathy", label: "High empathy", description: "Acknowledge the caller's situation with care." },
    { key: "echo_verification", label: "Echo verification", description: "Repeat important details to confirm accuracy." },
    { key: "nato_phonetic_alphabet", label: "NATO phonetic alphabet", description: "Use phonetic spelling when clarifying characters." },
    { key: "speech_normalization", label: "Speech normalization", description: "Speak dates, numbers, and abbreviations naturally." },
    { key: "smart_matching", label: "Smart matching", description: "Match the caller's wording and level of detail." },
    { key: "ai_disclosure", label: "AI disclosure", description: "Be transparent that the caller is speaking with AI." },
    { key: "scope_boundaries", label: "Scope boundaries", description: "Set clear expectations for requests outside the agent's role." },
]

export function AgentHandbookDialog() {
    const [open, setOpen] = React.useState(false)
    const [config, setConfig] = React.useState<HandbookConfig>(getHandbookConfig)

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) setConfig(getHandbookConfig())
        setOpen(nextOpen)
    }

    function toggle(key: keyof HandbookConfig, checked: boolean) {
        const nextConfig = { ...config, [key]: checked }
        setConfig(nextConfig)
        writeHandbookConfig({ [key]: checked })
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button type="button" variant="outline" className="h-9" onClick={() => handleOpenChange(true)}>
                Agent Handbook
            </Button>

            <DialogContent className="max-h-[90svh] max-w-xl overflow-y-auto p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Agent Handbook</DialogTitle>
                    <DialogDescription>
                        Choose the conversation guidelines this agent follows.
                    </DialogDescription>
                </DialogHeader>

                <div className="divide-y px-6">
                    {HANDBOOK_OPTIONS.map(({ key, label, description }) => (
                        <label key={key} className="flex cursor-pointer items-start gap-3 py-4">
                            <Checkbox
                                checked={config[key]}
                                onCheckedChange={(checked) => toggle(key, checked === true)}
                                className="mt-0.5"
                            />
                            <span className="grid gap-0.5">
                                <span className="text-sm font-medium">{label}</span>
                                <span className="text-sm text-muted-foreground">{description}</span>
                            </span>
                        </label>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
