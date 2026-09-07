"use client"

import * as React from "react"
import { CheckIcon, LanguagesIcon, SearchIcon } from "lucide-react"

import { getLanguage, writeLanguage } from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"

const LANGUAGES = [
    ["en-US", "English (United States)"], ["en-IN", "English (India)"], ["en-GB", "English (United Kingdom)"], ["en-AU", "English (Australia)"], ["en-NZ", "English (New Zealand)"],
    ["de-DE", "German (Germany)"], ["es-ES", "Spanish (Spain)"], ["es-419", "Spanish (Latin America)"], ["hi-IN", "Hindi (India)"], ["fr-FR", "French (France)"], ["fr-CA", "French (Canada)"],
    ["ja-JP", "Japanese (Japan)"], ["pt-PT", "Portuguese (Portugal)"], ["pt-BR", "Portuguese (Brazil)"], ["zh-CN", "Chinese (Simplified)"], ["ru-RU", "Russian (Russia)"], ["it-IT", "Italian (Italy)"],
    ["ko-KR", "Korean (South Korea)"], ["nl-NL", "Dutch (Netherlands)"], ["nl-BE", "Dutch (Belgium)"], ["pl-PL", "Polish (Poland)"], ["tr-TR", "Turkish (Turkey)"], ["vi-VN", "Vietnamese (Vietnam)"],
    ["ro-RO", "Romanian (Romania)"], ["bg-BG", "Bulgarian (Bulgaria)"], ["ca-ES", "Catalan (Spain)"], ["th-TH", "Thai (Thailand)"], ["da-DK", "Danish (Denmark)"], ["fi-FI", "Finnish (Finland)"],
    ["el-GR", "Greek (Greece)"], ["hu-HU", "Hungarian (Hungary)"], ["id-ID", "Indonesian (Indonesia)"], ["no-NO", "Norwegian (Norway)"], ["sk-SK", "Slovak (Slovakia)"],
    ["sv-SE", "Swedish (Sweden)"], ["lt-LT", "Lithuanian (Lithuania)"], ["lv-LV", "Latvian (Latvia)"], ["cs-CZ", "Czech (Czechia)"], ["ms-MY", "Malay (Malaysia)"],
    ["af-ZA", "Afrikaans (South Africa)"], ["ar-SA", "Arabic (Saudi Arabia)"], ["az-AZ", "Azerbaijani (Azerbaijan)"], ["bs-BA", "Bosnian (Bosnia and Herzegovina)"], ["cy-GB", "Welsh (United Kingdom)"],
    ["fa-IR", "Persian (Iran)"], ["fil-PH", "Filipino (Philippines)"], ["gl-ES", "Galician (Spain)"], ["he-IL", "Hebrew (Israel)"], ["hr-HR", "Croatian (Croatia)"],
    ["hy-AM", "Armenian (Armenia)"], ["is-IS", "Icelandic (Iceland)"], ["kk-KZ", "Kazakh (Kazakhstan)"], ["kn-IN", "Kannada (India)"], ["mk-MK", "Macedonian (North Macedonia)"],
    ["mr-IN", "Marathi (India)"], ["ne-NP", "Nepali (Nepal)"], ["sl-SI", "Slovenian (Slovenia)"], ["sr-RS", "Serbian (Serbia)"], ["sw-KE", "Swahili (Kenya)"],
    ["ta-IN", "Tamil (India)"], ["ur-IN", "Urdu (India)"], ["yue-CN", "Cantonese (China)"], ["uk-UA", "Ukrainian (Ukraine)"],
] as const

type LanguageCode = (typeof LANGUAGES)[number][0]

function getFlag(locale: string) {
    const region = locale.split("-")[1]
    if (!region || region === "419") return "🌐"
    return String.fromCodePoint(...region.toUpperCase().split("").map(char => 127397 + char.charCodeAt(0)))
}

function normalizeLanguages(language: string | string[]) {
    const values = Array.isArray(language) ? language : [language]
    const supported = values.filter(value => LANGUAGES.some(([code]) => code === value))
    return supported.length ? supported : ["en-US"]
}

export function LanguageSelect() {
    const [selected, setSelected] = React.useState(() => normalizeLanguages(getLanguage()))

    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")

    const filteredLanguages = LANGUAGES.filter(([code, label]) => `${code} ${label}`.toLowerCase().includes(query.trim().toLowerCase()))
    const selectedLabel = LANGUAGES.find(([code]) => code === selected[0])?.[1] ?? selected[0]

    function toggleLanguage(language: LanguageCode) {
        const isSelected = selected.includes(language)
        if (isSelected && selected.length === 1) return

        const next = isSelected
            ? selected.filter(item => item !== language)
            : [...selected, language]

        setSelected(next)
        writeLanguage(next.length === 1 ? next[0] : next)
    }

    function handleOpenChange(nextOpen: boolean) {
        if (nextOpen) {
            setSelected(normalizeLanguages(getLanguage()))
            setQuery("")
        }
        setOpen(nextOpen)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger render={<Button type="button" variant="outline" className="h-9 min-w-20 justify-start" />}>
                <LanguagesIcon className="size-4 text-muted-foreground" />
                <span className="max-w-21 truncate">{getFlag(selected[0])} {selectedLabel}</span>
                {selected.length > 1 ? <span className="text-muted-foreground">+{selected.length - 1}</span> : null}
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 gap-0 p-0">
                <PopoverHeader className="border-b px-4 py-3">
                    <PopoverTitle>Agent languages</PopoverTitle>
                    <PopoverDescription>Select one or more languages.</PopoverDescription>
                </PopoverHeader>
                <div className="border-b p-2">
                    <div className="relative">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search languages" className="pl-8" />
                    </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-1.5">
                    {filteredLanguages.map(([code, label]) => {
                        const isSelected = selected.includes(code)
                        return (
                            <Button key={code} type="button" variant="ghost" className="w-full justify-between" onClick={() => toggleLanguage(code)}>
                                <span className="min-w-0 truncate text-left">{getFlag(code)} {label}</span>
                                {isSelected ? <CheckIcon className="size-4 shrink-0" /> : null}
                            </Button>
                        )
                    })}
                    {!filteredLanguages.length ? <p className="px-2 py-4 text-center text-sm text-muted-foreground">No languages found.</p> : null}
                </div>
            </PopoverContent>
        </Popover>
    )
}
