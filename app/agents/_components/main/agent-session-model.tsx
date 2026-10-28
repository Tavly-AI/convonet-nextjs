"use client"

import * as React from "react"

import { getModel, getLLM_ModelSettings, writeModel, writeLLM_ModelSettings } from "@/app/agents/_lib/session-storage/agent-session"
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
import { Settings2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"

export function LLMModelSelect() {
    const [model, setModel] = React.useState(() => getModel())

    function changeModel(value: LlmModel) {
        setModel(value)
        writeModel(value)
    }

    return (
        <div className="flex items-center">
            <LLMModelDropdown
                value={model}
                onValueChange={changeModel}
                className="w-40 rounded-r-none"
            />

            <div className="-ml-px">
                <LLMModelSettings />
            </div>
        </div>
    )
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



function LLMModelSettings() {
    const [open, setOpen] = React.useState(false)
    const [draftTemperature, setDraftTemperature] = React.useState(() => getLLM_ModelSettings().model_temperature)
    const [draftStructuredOutput, setDraftStructuredOutput] = React.useState(() => getLLM_ModelSettings().tool_call_strict_mode)

    function handleOpenChange(value: boolean) {
        if (value) {
            const settings = getLLM_ModelSettings()
            setDraftTemperature(settings.model_temperature)
            setDraftStructuredOutput(settings.tool_call_strict_mode)
        }
        setOpen(value)
    }

    function handleSave() {
        writeLLM_ModelSettings({
            model_temperature: draftTemperature,
            tool_call_strict_mode: draftStructuredOutput,
        })
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                render={
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-9 shrink-0 rounded-l-none"
                    >
                        <Settings2Icon className="size-4" />
                    </Button>
                }
            />
            <PopoverContent align="start" className="w-80 space-y-5 p-4">
                <div className="space-y-2">
                    <div className="text-sm font-medium">LLM Temperature</div>
                    <p className="text-xs text-muted-foreground">
                        Lower values yield more consistent responses and better function call results.
                    </p>

                    <div className="flex items-center gap-3">
                        <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={[draftTemperature]}
                            onValueChange={(value) => {
                                const temperature = typeof value === "number" ? value : value[0]
                                if (temperature !== undefined) {
                                    setDraftTemperature(temperature)
                                }
                            }}
                        />
                        <span className="w-10 text-right text-sm tabular-nums">
                            {draftTemperature.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Structured Output</div>
                    <p className="text-xs text-muted-foreground">
                        Always generate responses that adhere to your supplied JSON schema.
                    </p>

                    <Switch
                        checked={draftStructuredOutput}
                        onCheckedChange={setDraftStructuredOutput}
                    />
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
