"use client"

import * as React from "react"
import { SparklesIcon } from "lucide-react"

import {
    getModel,
    writeModel,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MODELS = [
    { value: "gpt-4.1", label: "GPT 4.1" },
    { value: "gpt-4.1-mini", label: "GPT 4.1 mini" },
    { value: "gpt-4o", label: "GPT 4o" },
]

export function ModelSelect() {
    const [model, setModel] = React.useState<string>(() => getModel())

    function changeModel(value: string | null) {
        if (!value) return

        setModel(value)
        writeModel(value)
    }

    return (
        <Select value={model} onValueChange={changeModel}>
            <SelectTrigger className="h-9 min-w-32 max-w-32">
                <SparklesIcon className="size-4 text-emerald-600" />
                <SelectValue className="min-w-0 truncate" />
            </SelectTrigger>

            <SelectContent align="start">
                {MODELS.map(item => (
                    <SelectItem key={item.value} value={item.value}>
                        {item.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}