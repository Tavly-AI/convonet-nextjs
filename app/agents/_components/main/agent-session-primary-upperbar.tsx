"use client"

import { GaugeIcon, SquareStackIcon, WalletCardsIcon } from "lucide-react"
import { getAgentSession } from "../../_lib/session-storage/agent-session"
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { countTokensUsedByCurrentAgent } from "../../_actions/count-tokens-used-by-current-agent"

export function AgentSessionPrimaryUpperbar({ cost = "$0.115/min", latency = "1620-2100ms" }: { cost?: string, latency?: string }) {
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-3 text-xs">
            <Metric label="Agent Details" />
            <Metric label="Cost" value={cost} icon={WalletCardsIcon} />
            <Metric label="Latency" value={latency} icon={GaugeIcon} />
            {CalculateTokens()}
        </div>
    )
}

// MISC CODE

function Metric({ label, value, icon: Icon, }: { label: string, value?: string, icon?: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
            {Icon && <Icon className="size-3.5" />}
            <span>{label}</span>
            {value && (
                <span className="border-b border-dotted border-foreground/60 font-medium text-foreground">
                    {value}
                </span>
            )}
        </div>
    )
}

function CalculateTokens() {
    const [tokens, setTokens] = React.useState({
        total: 0,
        breakdown: [] as { label: string; count: number }[],
    })
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        let previous = ""
        let active = true
        let requestId = 0

        const update = async () => {
            const agent = getAgentSession()
            if (!agent) return

            const { llmConfig, config } = agent

            const sections = {
                "System Prompt": [
                    llmConfig.generalPrompt,
                    llmConfig.begin_message,
                    ...Object.values(llmConfig.default_dynamic_variables ?? {}),
                ],
                "Tool Definitions": [config.generalTools, llmConfig.mcps],
                "Speech Settings": [config.pronunciation_dictionary, config.boosted_keywords],
                "Post Call Extraction": [config.post_call_analysis_data],
            }

            const formatted = Object.fromEntries(
                Object.entries(sections).map(([key, values]) => [
                    key,
                    values.filter(Boolean).map(value =>
                        typeof value === "string" ? value : JSON.stringify(value)
                    ).join("\n"),
                ])
            )

            const snapshot = JSON.stringify([llmConfig.model, formatted])
            if (snapshot === previous) return

            previous = snapshot
            const currentRequest = ++requestId

            setLoading(true)

            try {
                const result = await countTokensUsedByCurrentAgent(llmConfig.model, formatted)
                if (active && currentRequest === requestId) setTokens(result)
            } catch (error) {
                console.error("Token calculation failed:", error)
                if (active && currentRequest === requestId) previous = ""
            } finally {
                if (active && currentRequest === requestId) setLoading(false)
            }
        }

        void update()
        const interval = setInterval(update, 1000)

        return () => {
            active = false
            clearInterval(interval)
        }
    }, [])

    return (
        <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 text-muted-foreground">
                <SquareStackIcon className="size-3.5" />
                <span>Tokens</span>
                <span className={`border-b border-dotted border-foreground/60 font-medium text-foreground ${loading ? "animate-pulse" : ""}`}>
                    {loading ? "calculating..." : tokens.total.toLocaleString()}
                </span>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-72 space-y-3 p-3 text-xs">
                <div className="rounded-md bg-muted p-3">
                    <p className="text-muted-foreground">Estimated Tokens</p>
                    <p className="mt-1 text-lg font-semibold">
                        {tokens.total.toLocaleString()} tokens
                    </p>
                </div>

                <Separator />

                <div className="space-y-2.5">
                    {tokens.breakdown.map(({ label, count }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-medium tabular-nums">
                                {count.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>

                <Separator />

                <p className="text-muted-foreground">
                    Estimated token usage based on your agent configuration.
                    Actual LLM usage may vary.
                </p>
            </PopoverContent>
        </Popover>
    )
}