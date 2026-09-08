"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpenIcon, ChevronDownIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"

import {
    getWorkspaceKnowledgeBases,
    type WorkspaceKnowledgeBase,
} from "@/app/dashboard/knowledge-base/_lib/knowledge-base-actions"
import {
    getKnowledgeBaseSettings,
    type KnowledgeBaseConfig,
    writeKnowledgeBaseSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Field } from "../functions/general-tool-form"
import { Section } from "../speech-settings/speech-settings"

export function KnowledgeBaseSettings() {
    const [knowledgeBases, setKnowledgeBases] = React.useState<WorkspaceKnowledgeBase[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [loadError, setLoadError] = React.useState("")
    const [settings, setSettings] = React.useState(getKnowledgeBaseSettings)

    // ==================================================
    // ================= QUERY LOGIC ====================
    // ==================================================

    const [query, setQuery] = React.useState("")

    const selectedKnowledgeBases = knowledgeBases.filter((knowledgeBase) =>
        settings.knowledge_base_ids.includes(knowledgeBase.id)
    )
    const visibleKnowledgeBases = knowledgeBases.filter((knowledgeBase) =>
        knowledgeBase.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    )

    // ==================================================
    // ================= GET / UPDATE KB ================
    // ==================================================

    React.useEffect(() => {
        let active = true

        void getWorkspaceKnowledgeBases()
            .then((items) => {
                if (active) setKnowledgeBases(items)
            })
            .catch(() => {
                if (active) setLoadError("Could not load knowledge bases.")
            })
            .finally(() => {
                if (active) setIsLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    // updates top_k and filter_score
    function updateConfig(kb_config: Partial<KnowledgeBaseConfig>) {
        const nextSettings = writeKnowledgeBaseSettings({ kb_config })
        setSettings(nextSettings)
    }

    // update kb
    function toggleKnowledgeBase(id: string, checked: boolean) {
        const knowledge_base_ids = checked
            ? [...new Set([...settings.knowledge_base_ids, id])]
            : settings.knowledge_base_ids.filter((knowledgeBaseId) => knowledgeBaseId !== id)
        const nextSettings = writeKnowledgeBaseSettings({ knowledge_base_ids })
        setSettings(nextSettings)
    }

    // ==================================================
    // =============== DELETE / CLEAR KB ================
    // ==================================================


    function clearKnowledgeBases() {
        const nextSettings = writeKnowledgeBaseSettings({ knowledge_base_ids: [] })
        setSettings(nextSettings)
    }

    return (
        <div className="space-y-8 rounded-3xl border-t bg-gray-400/10 px-5 py-6">
            <Section
                title="Knowledge Bases"
                description="Choose the uploaded knowledge bases this agent can search during a conversation."
            >
                <div className="flex flex-col items-left gap-2">
                    <Popover>
                        <PopoverTrigger
                            render={
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start gap-3 bg-background text-left"
                                    disabled={isLoading || Boolean(loadError) || knowledgeBases.length === 0}
                                />
                            }
                        >
                            <BookOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">
                                {isLoading
                                    ? "Loading knowledge bases…"
                                    : selectedKnowledgeBases.length === 0
                                        ? "Select knowledge bases"
                                        : selectedKnowledgeBases.length === 1
                                            ? selectedKnowledgeBases[0].name
                                            : `${selectedKnowledgeBases.length} knowledge bases selected`}
                            </span>
                            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0">
                            <PopoverHeader className="border-b px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <PopoverTitle>Choose knowledge bases</PopoverTitle>
                                    {selectedKnowledgeBases.length > 0 && (
                                        <Button type="button" variant="ghost" size="sm" onClick={clearKnowledgeBases}>
                                            <XIcon data-icon="inline-start" />
                                            Clear
                                        </Button>
                                    )}
                                </div>
                                <PopoverDescription>
                                    {selectedKnowledgeBases.length} of {knowledgeBases.length} selected
                                </PopoverDescription>
                            </PopoverHeader>
                            <div className="border-b p-3">
                                <div className="relative">
                                    <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search knowledge bases"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-y-auto p-2">
                                {visibleKnowledgeBases.length === 0 ? (
                                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                                        No knowledge bases match your search.
                                    </p>
                                ) : (
                                    visibleKnowledgeBases.map((knowledgeBase) => {
                                        const checked = settings.knowledge_base_ids.includes(knowledgeBase.id)

                                        return (
                                            <Label
                                                key={knowledgeBase.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={(value) => toggleKnowledgeBase(knowledgeBase.id, value === true)}
                                                />
                                                <span className="min-w-0 flex-1 truncate font-medium">{knowledgeBase.name}</span>
                                            </Label>
                                        )
                                    })
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        render={<Link href="/dashboard/knowledge-base" target="_blank" rel="noopener noreferrer" />}
                        variant="outline"
                        className="shrink-0 w-30"
                    >
                        <PlusIcon data-icon="inline-start" />
                        Add KB
                    </Button>
                </div>
                {loadError ? (
                    <p className="text-sm text-destructive">{loadError}</p>
                ) : !isLoading && knowledgeBases.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No knowledge bases are available. Create one from the Knowledge Base dashboard first.
                    </p>
                ) : null}
            </Section>

            <Section
                title="Retrieval Settings"
                description="Control how many matching document chunks are included and the minimum match score."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Results to retrieve">
                        <Input
                            id="knowledge-base-top-k"
                            type="number"
                            min={1}
                            step={1}
                            value={settings.kb_config.top_k}
                            onChange={(event) => {
                                const top_k = Number(event.target.value)
                                if (Number.isInteger(top_k) && top_k >= 1) updateConfig({ top_k })
                            }}
                        />
                    </Field>
                    <Field label="Min match score">
                        <Input
                            id="knowledge-base-filter-score"
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={settings.kb_config.filter_score}
                            onChange={(event) => {
                                const filter_score = Number(event.target.value)
                                if (filter_score >= 0 && filter_score <= 1) updateConfig({ filter_score })
                            }}
                        />
                    </Field>
                </div>
            </Section>
        </div>
    )
}
