"use client"

import * as React from "react"

import { getModel, writeModel } from "@/app/agents/_lib/session-storage/agent-session"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { CHATGPT_SVG, LLM_MODELS, type LlmModel } from "@/app/agents/_components/main/agent-session-model-server"
export { CHATGPT_SVG, CLAUDE_SVG, GEMINI_SVG, LLM_MODELS, type LlmModel, type LlmProvider } from "@/app/agents/_components/main/agent-session-model-server"

export function LLMModelSelect() {
    const [model, setModel] = React.useState(() => getModel())

    function changeModel(value: LlmModel) {
        setModel(value)
        writeModel(value)
    }

    return <LLMModelDropdown value={model} onValueChange={changeModel} />
}


export function LLMModelDropdown({
    value,
    onValueChange,
    className = "w-32",
}: {
    value: LlmModel
    onValueChange: (value: LlmModel) => void
    className?: string
}) {
    return (
        <Select
            value={value}
            onValueChange={(value) => { if (value !== null) { onValueChange(value as LlmModel) } }}
        >
            <SelectTrigger className={`h-9! ${className}`}>
                <span
                    className="size-4 shrink-0 [&>svg]:size-4"
                    dangerouslySetInnerHTML={{
                        __html:
                            LLM_MODELS.find(([model]) => model === value)?.[2] ??
                            CHATGPT_SVG,
                    }}
                />
                <SelectValue>
                    {LLM_MODELS.find(([model]) => model === value)?.[1]}
                </SelectValue>
            </SelectTrigger>

            <SelectContent className="max-h-96 w-96">
                <SelectGroup>
                    <SelectLabel>Suggested</SelectLabel>

                    {LLM_MODELS.filter(([, , , , suggested]) => suggested).map(
                        ([model, label, svg, price]) => (
                            <SelectItem key={model} value={model} className="py-2">
                                <span
                                    className="size-4 shrink-0 [&>svg]:size-4"
                                    dangerouslySetInnerHTML={{ __html: svg }}
                                />
                                <span>{label}</span>
                                <Badge variant="secondary" className="rounded-full">
                                    Suggested
                                </Badge>
                                <span className="text-muted-foreground">
                                    ({price})
                                </span>
                            </SelectItem>
                        )
                    )}
                </SelectGroup>

                <SelectSeparator />

                <SelectGroup>
                    <SelectLabel>Other models</SelectLabel>

                    {LLM_MODELS.filter(([, , , , suggested]) => !suggested).map(
                        ([model, label, svg, price]) => (
                            <SelectItem key={model} value={model} className="py-2">
                                <span
                                    className="size-4 shrink-0 [&>svg]:size-4"
                                    dangerouslySetInnerHTML={{ __html: svg }}
                                />
                                <span>{label}</span>
                                <span className="text-muted-foreground">
                                    ({price})
                                </span>
                            </SelectItem>
                        )
                    )}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}