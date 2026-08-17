"use client"

import * as React from "react"

import {
    getLanguage,
    writeLanguage,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const LANGUAGES = [
    { value: "en-US", label: "English", region: "US", flag: "🇺🇸" },
    { value: "en-GB", label: "English", region: "GB", flag: "🇬🇧" },
    { value: "hi-IN", label: "Hindi", region: "IN", flag: "🇮🇳" },
]

export function LanguageSelect() {
    const [language, setLanguage] = React.useState(
        () => getLanguage() ?? "en-US"
    )

    const selectedLanguage =
        LANGUAGES.find(item => item.value === language) ?? LANGUAGES[0]

    function changeLanguage(value: string | null) {
        if (!value) return

        setLanguage(value)
        writeLanguage(value)
    }

    return (
        <Select value={language} onValueChange={changeLanguage}>
            <SelectTrigger className="h-9 min-w-32">
                <span aria-hidden="true">{selectedLanguage.flag}</span>
                <SelectValue />
                <span className="text-muted-foreground">
                    ({selectedLanguage.region})
                </span>
            </SelectTrigger>

            <SelectContent align="start">
                {LANGUAGES.map(item => (
                    <SelectItem key={item.value} value={item.value}>
                        {item.flag} {item.label} ({item.region})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}