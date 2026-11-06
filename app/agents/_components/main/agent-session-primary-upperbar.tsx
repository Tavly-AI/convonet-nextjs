"use client"

import { GaugeIcon, SquareStackIcon, WalletCardsIcon } from "lucide-react"
import { getAgentSession } from "../../_lib/session-storage/agent-session"
import React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { countTokensUsedByCurrentAgent } from "../../_actions/count-tokens-used-by-current-agent"
import { BILLING_GLOBAL_CONFIG_VALUES } from "@/app/dashboard/billing/_lib/billing-payment-config"
import { VOICES_UPDATED } from "../../_data/voices-updated"

export function AgentSessionPrimaryUpperbar({ latency = "1620-2100ms" }: { latency?: string }) {
    return (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-3 text-xs">
            <Metric label="Agent Details" />
            {CalculateCost()}
            <Metric label="Latency" value={latency} icon={GaugeIcon} />
            {CalculateTokens()}
        </div>
    )
}

function CalculateCost() {
    const [pricing, setPricing] = React.useState<{ total: number | null; unit: "min" | "message" | null; items: { label: string; rate: number; unit: "min" | "message" }[] }>({ total: null, unit: null, items: [] })

    React.useEffect(() => {
        const update = () => {
            const agent = getAgentSession()
            if (!agent) {
                setPricing({ total: null, unit: null, items: [] })
                return
            }

            // Resolve whether the agent is chat or voice.
            const chat = agent.channel === "chat"

            // Resolve LLM pricing: per message for chat, per minute for voice.
            const llmRate = chat ? BILLING_GLOBAL_CONFIG_VALUES.chatLlm[agent.llmConfig.model] : BILLING_GLOBAL_CONFIG_VALUES.llm[agent.llmConfig.model]

            // resolve tts model and its pricing
            const selected_voice_voice_updated = VOICES_UPDATED.find(v => v.voice_id === agent.config.voiceId)
            const resolved_voice_model = agent.config.voice_model ?? selected_voice_voice_updated?.model.replaceAll(" ", "-")

            const rates = [
                { label: `LLM (${agent.llmConfig.model})`, rate: llmRate, unit: chat ? "message" as const : "min" as const },
                ...(!chat ? [
                    {
                        label: `TTS (${resolved_voice_model ?? "Unknown voice model"})`,
                        rate: resolved_voice_model ? (BILLING_GLOBAL_CONFIG_VALUES.tts as Record<string, number>)[resolved_voice_model] : undefined,
                        unit: "min" as const
                    },
                    { label: "STT (Deepgram Nova-3)", rate: BILLING_GLOBAL_CONFIG_VALUES.stt.deepgram["nova-3"], unit: "min" as const },
                ] : []),
                ...(agent.llmConfig.knowledge_base_ids?.length ? [{ label: "Knowledge base", rate: BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerMinute, unit: "min" as const }] : []),
                ...((agent.config.guardrail_config?.input_topics?.length || agent.config.guardrail_config?.output_topics?.length) ? [{ label: "Safety guardrails", rate: BILLING_GLOBAL_CONFIG_VALUES.safetyGuardrails.pricePerMinute, unit: "min" as const }] : []),
                ...(agent.config.pii_config?.categories?.length ? [{ label: "PII removal", rate: BILLING_GLOBAL_CONFIG_VALUES.piiRemoval.pricePerMinute, unit: "min" as const }] : []),
            ]

            // calculate estimated costs
            const unit = chat ? "message" : "min"
            const items = rates.filter((item): item is typeof item & { rate: number } => typeof item.rate === "number")
            const baseRates = items.filter(item => item.unit === unit)
            const available = rates.every(item => typeof item.rate === "number")
            setPricing({ total: available ? baseRates.reduce((sum, item) => sum + item.rate, 0) : null, unit, items })
        }

        update()
        const interval = window.setInterval(update, 1000)
        return () => window.clearInterval(interval)
    }, [])

    const display = pricing.total === null ? "—" : `$${pricing.total.toFixed(4)}/${pricing.unit}`

    return (
        <Popover>
            <PopoverTrigger className="flex items-center gap-1.5 text-muted-foreground">
                <WalletCardsIcon className="size-3.5" />
                <span>Cost</span>
                <span className="border-b border-dotted border-foreground/60 font-medium text-foreground">{display}</span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3 p-3 text-xs">
                <p className="font-medium">Estimated model pricing</p>
                {pricing.items.length ? <div className="space-y-2">{pricing.items.map(({ label, rate, unit }) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">${rate.toFixed(4)}/{unit}</span>
                    </div>
                ))}</div> : <p className="text-muted-foreground">Pricing is unavailable for this session.</p>}
                <Separator />
                <p className="text-muted-foreground">{pricing.total === null ? "Select a session with configured model rates to see pricing." : `Total estimated rate: ${display}.`} Add-on rates are per minute. Telephony and surcharges are excluded.</p>
            </PopoverContent>
        </Popover>
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
