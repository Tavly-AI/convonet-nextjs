"use client"

import * as React from "react"
import {
  ArrowRightLeftIcon,
  BracesIcon,
  MoreHorizontalIcon,
  PhoneOffIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import type {
  CustomFunctionTool,
  EndCallTool,
  GeneralTool,
  TransferCallTool,
} from "@/app/agents/_lib/functions/general-tools"
import { GeneralToolForm } from "./general-tool-form"

const TOOL_OPTIONS = [
  {
    type: "end_call" as const,
    label: "End Call",
    description: "End the conversation when its conditions are met.",
    icon: PhoneOffIcon,
  },
  {
    type: "transfer_call" as const,
    label: "Call Transfer",
    description: "Route the caller to a person or external number.",
    icon: ArrowRightLeftIcon,
  },
  {
    type: "custom" as const,
    label: "Custom Function",
    description: "Call your own API during the conversation.",
    icon: BracesIcon,
  },
]

export function GeneralToolsEditor() {
  const [tools, setTools] = React.useState<GeneralTool[]>([])
  const [draft, setDraft] = React.useState<GeneralTool | null>(null)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null)
  const [error, setError] = React.useState("")

  function openNew(type: GeneralTool["type"]) {
    setEditingIndex(null)
    setError("")
    setDraft(createTool(type))
  }

  function openEdit(index: number) {
    setEditingIndex(index)
    setError("")
    setDraft(structuredClone(tools[index]))
  }

  function saveTool() {
    if (!draft) return

    const validationError = validateTool(draft, tools, editingIndex)
    if (validationError) {
      setError(validationError)
      return
    }

    const nextDraft = normalizeTool(draft)

    setTools((current) =>
      editingIndex === null
        ? [...current, nextDraft]
        : current.map((tool, index) => (index === editingIndex ? nextDraft : tool))
    )
    setDraft(null)
  }

  return (
    <div className="space-y-3 border-t px-1 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Tools the agent can use during any conversation.
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button size="sm" variant="outline" />}>
            <PlusIcon data-icon="inline-start" />
            Add
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {TOOL_OPTIONS.map(({ type, label, icon: Icon }) => (
              <DropdownMenuItem
                key={type}
                disabled={type === "end_call" && tools.some((tool) => tool.type === type)}
                onClick={() => openNew(type)}
              >
                <Icon />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No functions added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {tools.map((tool, index) => {
            const option = TOOL_OPTIONS.find((item) => item.type === tool.type)!
            const Icon = option.icon

            return (
              <button
                key={`${tool.type}-${tool.name}`}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                onClick={() => openEdit(index)}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4 text-muted-foreground" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{tool.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.label} · {tool.description}
                  </span>
                </span>
                <MoreHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="flex max-h-[92svh] max-w-3xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-5">
            <DialogTitle>
              {editingIndex === null ? "Add" : "Edit"} {draft && toolLabel(draft.type)}
            </DialogTitle>
            <DialogDescription>
              Configure when and how this function should run.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <GeneralToolForm value={draft} onChange={setDraft} />
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter className="shrink-0 border-t px-6 py-4">
            {editingIndex !== null && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => setDeleteIndex(editingIndex)}
              >
                <Trash2Icon data-icon="inline-start" />
                Delete
              </Button>
            )}
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="button" onClick={saveTool}>
              Save function
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Delete function?</DialogTitle>
            <DialogDescription>
              This removes the function from the current agent configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteIndex !== null) {
                  setTools((current) => current.filter((_, index) => index !== deleteIndex))
                }
                setDeleteIndex(null)
                setDraft(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function createTool(type: GeneralTool["type"]): GeneralTool {
  if (type === "end_call") {
    return {
      type,
      name: "end_call",
      description: "End the call when the conversation is complete.",
    } satisfies EndCallTool
  }

  if (type === "transfer_call") {
    return {
      type,
      name: "transfer_call",
      description: "Transfer the caller to a human agent.",
      transfer_destination: {
        type: "predefined",
        number: "",
        ignore_e164_validation: false,
        extension: "",
      },
      transfer_option: {
        type: "cold_transfer",
        show_transferee_as_caller: false,
        sip_transfer_method: "invite",
        ring_duration_ms: 30000,
        on_hold_music: "ringtone",
        navigate_ivr: false,
        has_internal_queue: false,
        wait_for_answer_ms: 30000,
        whisper_message: "",
        three_way_ringtone: false,
        three_way_message: "",
        transfer_agent_id: "",
        action_on_timeout: "cancel_transfer",
      },
      custom_sip_headers: [],
    } satisfies TransferCallTool
  }

  return {
    type,
    name: "custom_function",
    description: "",
    method: "POST",
    url: "",
    timeout_ms: 120000,
    headers: [],
    query_params: [],
    parameters: { type: "object", properties: {} },
    parameters_json: JSON.stringify({ type: "object", properties: {} }, null, 2),
    parameter_mode: "form",
    parameter_fields: [],
    args_only: false,
    response_variables: [],
    speak_during_execution: { enabled: false, type: "prompt", text: "" },
    speak_after_execution: true,
    max_retry: 0,
  } satisfies CustomFunctionTool
}

function validateTool(tool: GeneralTool, tools: GeneralTool[], editingIndex: number | null) {
  if (!/^[A-Za-z_]+$/.test(tool.name)) return "Name can contain only letters and underscores."
  if (!tool.description.trim()) return "Description is required."
  if (tools.some((item, index) => index !== editingIndex && item.name === tool.name)) {
    return "Function names must be unique."
  }
  if (tool.type === "transfer_call" && !tool.transfer_destination.number.trim()) {
    return "Transfer destination is required."
  }
  if (tool.type === "transfer_call" && tool.transfer_option.type === "agentic_warm_transfer" && !tool.transfer_option.transfer_agent_id.trim()) {
    return "Transfer agent ID is required for agentic warm transfer."
  }
  if (tool.type === "custom" && !tool.url.trim()) return "API endpoint is required."
  if (tool.type === "custom" && tool.parameter_mode === "json") {
    try {
      const schema = JSON.parse(tool.parameters_json)
      if (!schema || Array.isArray(schema) || schema.type !== "object") {
        return 'Parameter schema must be a JSON object with type "object".'
      }
    } catch {
      return "Parameter schema must contain valid JSON."
    }
  }
  return ""
}

function normalizeTool(tool: GeneralTool): GeneralTool {
  if (tool.type !== "custom") return tool

  if (tool.parameter_mode === "json") {
    return { ...tool, parameters: JSON.parse(tool.parameters_json) }
  }

  const required = tool.parameter_fields
    .filter((parameter) => parameter.required && parameter.name)
    .map((parameter) => parameter.name)
  const properties = Object.fromEntries(
    tool.parameter_fields
      .filter((parameter) => parameter.name)
      .map((parameter) => [
        parameter.name,
        {
          type: parameter.type,
          ...(parameter.description && { description: parameter.description }),
        },
      ])
  )

  return {
    ...tool,
    parameters: {
      type: "object",
      properties,
      ...(required.length > 0 && { required }),
    },
  }
}

function toolLabel(type: GeneralTool["type"]) {
  return TOOL_OPTIONS.find((item) => item.type === type)?.label
}
