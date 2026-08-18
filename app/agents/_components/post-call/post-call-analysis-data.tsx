"use client"

import * as React from "react"
import {
    CheckCircle2Icon,
    FileTextIcon,
    ListChecksIcon,
    MoreHorizontalIcon,
    PlusIcon,
    SmileIcon,
    Trash2Icon,
} from "lucide-react"

import { Field } from "@/app/agents/_components/functions/general-tool-form"
import type {
    PostCallAnalysisData as PostCallAnalysisField,
    PostCallAnalysisModel,
    PostCallAnalysisSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
    DEFAULT_POST_CALL_ANALYSIS_SETTINGS,
    getPostCallAnalysisSettings,
    writePostCallAnalysisSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const MODELS = [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
] as const satisfies readonly PostCallAnalysisModel[]

const FIELD_TYPES = [
    { type: "string" as const, label: "Text", icon: FileTextIcon },
    { type: "number" as const, label: "Number", icon: ListChecksIcon },
    { type: "boolean" as const, label: "Boolean", icon: CheckCircle2Icon },
    { type: "enum" as const, label: "Selector", icon: ListChecksIcon },
]

const PRESETS = [
    {
        name: "call_summary",
        label: "Call Summary",
        description: "Summarize the call in a few sentences.",
        icon: FileTextIcon,
    },
    {
        name: "call_successful",
        label: "Call Successful",
        description: "Determine whether the call completed successfully.",
        icon: CheckCircle2Icon,
    },
    {
        name: "user_sentiment",
        label: "User Sentiment",
        description: "Evaluate the user's sentiment based on the conversation.",
        icon: SmileIcon,
    },
]

export function PostCallAnalysisData() {
    const [settings, setSettings] = React.useState<PostCallAnalysisSettings>(() => {
        const storedSettings = getPostCallAnalysisSettings()

        return {
            ...DEFAULT_POST_CALL_ANALYSIS_SETTINGS,
            ...storedSettings,
            post_call_analysis_data: Array.isArray(storedSettings.post_call_analysis_data)
                ? storedSettings.post_call_analysis_data
                : DEFAULT_POST_CALL_ANALYSIS_SETTINGS.post_call_analysis_data,
            post_call_analysis_model: MODELS.includes(
                storedSettings.post_call_analysis_model as PostCallAnalysisModel
            )
                ? storedSettings.post_call_analysis_model as PostCallAnalysisModel
                : DEFAULT_POST_CALL_ANALYSIS_SETTINGS.post_call_analysis_model,
        }
    })
    const [draft, setDraft] = React.useState<PostCallAnalysisField | null>(null)
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
    const [error, setError] = React.useState("")

    function updateSettings(patch: Partial<PostCallAnalysisSettings>) {
        const nextSettings = { ...settings, ...patch }

        writePostCallAnalysisSettings(patch)
        setSettings(nextSettings)
    }

    function openNew(field: PostCallAnalysisField) {
        setEditingIndex(null)
        setError("")
        setDraft(field)
    }

    function openEdit(index: number) {
        setEditingIndex(index)
        setError("")
        setDraft(structuredClone(settings.post_call_analysis_data[index]))
    }

    function saveField() {
        if (!draft) return
        if (!draft.name.trim()) {
            setError("Name is required.")
            return
        }
        if (!draft.description.trim()) {
            setError("Description is required.")
            return
        }
        if (
            settings.post_call_analysis_data.some(
                (field, index) => index !== editingIndex && field.name === draft.name
            )
        ) {
            setError("Field names must be unique.")
            return
        }

        const nextField = normalizeField(draft)
        const nextData =
            editingIndex === null
                ? [...settings.post_call_analysis_data, nextField]
                : settings.post_call_analysis_data.map((field, index) =>
                    index === editingIndex ? nextField : field
                )

        updateSettings({ post_call_analysis_data: nextData })
        setDraft(null)
    }

    return (
        <div className="space-y-3 border-t px-1 py-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    Extract structured data from completed calls.
                </p>
            </div>

            {settings.post_call_analysis_data.length === 0 ? (
                <div className="space-y-3 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    <p>No post-call fields added yet.</p>
                    <AddAnalysisDropdown
                        fields={settings.post_call_analysis_data}
                        onAdd={openNew}
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    {settings.post_call_analysis_data.map((field, index) => {
                        const option = getFieldOption(field)
                        const Icon = option.icon

                        return (
                            <button
                                key={`${field.type}-${field.name}`}
                                type="button"
                                className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                                onClick={() => openEdit(index)}
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Icon className="size-4 text-muted-foreground" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium">{field.name}</span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {option.label} · {field.description}
                                    </span>
                                </span>
                                <MoreHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
                            </button>
                        )
                    })}
                </div>
            )}

            <div className="flex items-center gap-2">
                <AnalysisModelDropdown
                    value={settings.post_call_analysis_model}
                    onChange={(post_call_analysis_model) =>
                        updateSettings({ post_call_analysis_model })
                    }
                />
                {settings.post_call_analysis_data.length > 0 && (
                    <AddAnalysisDropdown
                        fields={settings.post_call_analysis_data}
                        onAdd={openNew}
                    />
                )}
            </div>

            <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
                <DialogContent className="flex max-h-[92svh] max-w-2xl flex-col overflow-hidden p-0">
                    <DialogHeader className="shrink-0 border-b px-6 py-5">
                        <DialogTitle>
                            {editingIndex === null ? "Add" : "Edit"} {draft && getFieldOption(draft).label}
                        </DialogTitle>
                        <DialogDescription>
                            Configure the field Retell should extract after the call.
                        </DialogDescription>
                    </DialogHeader>

                    {draft && (
                        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                            <PostCallFieldForm value={draft} onChange={setDraft} />
                            {error && <p className="text-sm text-destructive">{error}</p>}
                        </div>
                    )}

                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        {editingIndex !== null && (
                            <Button
                                type="button"
                                variant="destructive"
                                className="sm:mr-auto"
                                onClick={() => {
                                    updateSettings({
                                        post_call_analysis_data: settings.post_call_analysis_data.filter(
                                            (_, index) => index !== editingIndex
                                        ),
                                    })
                                    setDraft(null)
                                }}
                            >
                                <Trash2Icon data-icon="inline-start" />
                                Delete
                            </Button>
                        )}
                        <DialogClose render={<Button type="button" variant="outline" />}>
                            Cancel
                        </DialogClose>
                        <Button type="button" onClick={saveField}>
                            Save field
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


// MISC CODE

function AnalysisModelDropdown({
    value,
    onChange,
}: {
    value: PostCallAnalysisModel
    onChange: (value: PostCallAnalysisModel) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
                Model: {value}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                {MODELS.map((model) => (
                    <DropdownMenuItem key={model} onClick={() => onChange(model)}>
                        {model}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function AddAnalysisDropdown({
    fields,
    onAdd,
}: {
    fields: PostCallAnalysisField[]
    onAdd: (field: PostCallAnalysisField) => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
                <PlusIcon data-icon="inline-start" />
                Add
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
                    <DropdownMenuItem key={type} onClick={() => onAdd(createField(type))}>
                        <Icon />
                        {label}
                    </DropdownMenuItem>
                ))}
                {PRESETS.map(({ name, label, description, icon: Icon }) => (
                    <DropdownMenuItem
                        key={name}
                        disabled={fields.some((field) => field.name === name)}
                        onClick={() =>
                            onAdd({
                                type: "system-presets",
                                name,
                                description,
                            })
                        }
                    >
                        <Icon />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

function PostCallFieldForm({
    value,
    onChange,
}: {
    value: PostCallAnalysisField
    onChange: (value: PostCallAnalysisField) => void
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
                <Input
                    value={value.name}
                    onChange={(event) => onChange({ ...value, name: event.target.value })}
                    placeholder={value.type === "system-presets" ? "call_summary" : "customer_name"}
                />
            </Field>
            <Field label="Type">
                <Select
                    value={value.type}
                    disabled={value.type === "system-presets"}
                    onValueChange={(type) =>
                        onChange({
                            ...value,
                            type: type as PostCallAnalysisField["type"],
                        })
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {FIELD_TYPES.map(({ type, label }) => (
                            <SelectItem key={type} value={type}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
            <div className="sm:col-span-2">
                <Field label={value.type === "system-presets" ? "Prompt" : "Description"}>
                    <Textarea
                        value={value.description}
                        onChange={(event) => onChange({ ...value, description: event.target.value })}
                        placeholder="Describe exactly what should be extracted."
                    />
                </Field>
            </div>
            {value.type !== "system-presets" && (
                <>
                    <div className="sm:col-span-2">
                        <Field label="Examples">
                            <Input
                                value={value.examples?.join(", ") ?? ""}
                                onChange={(event) => onChange({ ...value, examples: splitList(event.target.value) })}
                                placeholder="John Doe, Jane Smith"
                            />
                        </Field>
                    </div>
                    {value.type === "enum" && (
                        <div className="sm:col-span-2">
                            <Field label="Choices">
                                <ChoiceEditor
                                    value={value.choices ?? []}
                                    onChange={(choices) => onChange({ ...value, choices })}
                                />
                            </Field>
                        </div>
                    )}
                    <div className="sm:col-span-2">
                        <Field label="Conditional prompt">
                            <Textarea
                                value={value.conditional_prompt ?? ""}
                                onChange={(event) =>
                                    onChange({ ...value, conditional_prompt: event.target.value })
                                }
                                placeholder="Only extract this when a customer provides the information."
                            />
                        </Field>
                    </div>
                    <label className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Checkbox
                            checked={Boolean(value.required)}
                            onCheckedChange={(required) => onChange({ ...value, required: Boolean(required) })}
                        />
                        Required
                    </label>
                </>
            )}
        </div>
    )
}

function ChoiceEditor({
    value,
    onChange,
}: {
    value: string[]
    onChange: (value: string[]) => void
}) {
    return (
        <div className="space-y-2">
            {value.map((choice, index) => (
                <div key={index} className="flex gap-2">
                    <Input
                        value={choice}
                        onChange={(event) =>
                            onChange(value.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item
                            ))
                        }
                        placeholder="Choice"
                    />
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove choice"
                        onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                    >
                        <Trash2Icon />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onChange([...value, ""])}
            >
                <PlusIcon data-icon="inline-start" />
                Add choice
            </Button>
        </div>
    )
}

function createField(type: PostCallAnalysisField["type"]): PostCallAnalysisField {
    return {
        type,
        name: "",
        description: "",
        required: false,
    }
}

function normalizeField(field: PostCallAnalysisField): PostCallAnalysisField {
    return {
        ...field,
        name: field.name.trim(),
        description: field.description.trim(),
        examples: field.examples?.filter(Boolean),
        choices: field.type === "enum" ? field.choices?.filter(Boolean) : undefined,
        conditional_prompt: field.conditional_prompt?.trim() || undefined,
    }
}

function splitList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
}

function getFieldOption(field: PostCallAnalysisField) {
    if (field.type === "system-presets") {
        return PRESETS.find((preset) => preset.name === field.name) ?? {
            label: "Preset",
            icon: FileTextIcon,
        }
    }

    return FIELD_TYPES.find((option) => option.type === field.type) ?? FIELD_TYPES[0]
}
