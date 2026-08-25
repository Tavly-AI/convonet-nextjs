"use client"

import * as React from "react"
import {
  ArrowRightLeftIcon,
  BracesIcon,
  CalendarCheckIcon,
  CalendarDaysIcon,
  HashIcon,
  MoreHorizontalIcon,
  PhoneForwardedIcon,
  PhoneOffIcon,
  PlusIcon,
  Trash2Icon,
  XCircleIcon,
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
  BookAppointmentCalTool,
  BridgeTransferTool,
  CancelTransferTool,
  CheckAvailabilityCalTool,
  CustomFunctionTool,
  EndCallTool,
  GeneralTool,
  PressDigitTool,
  TransferCallTool,
  TransferHoldMusic,
} from "@/app/agents/_lib/functions/general-tools"
import {
  getGeneralTools,
  writeGeneralTools,
} from "@/app/agents/_lib/session-storage/agent-session"
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
    type: "check_availability_cal" as const,
    label: "Check Availability",
    description: "Check Cal.com availability for an event type.",
    icon: CalendarDaysIcon,
  },
  {
    type: "book_appointment_cal" as const,
    label: "Book Appointment",
    description: "Book a Cal.com appointment for an event type.",
    icon: CalendarCheckIcon,
  },
  {
    type: "press_digit" as const,
    label: "Press Digit",
    description: "Send DTMF digits while navigating an IVR.",
    icon: HashIcon,
  },
  {
    type: "bridge_transfer" as const,
    label: "Bridge Transfer",
    description: "Bridge an agentic warm transfer to the target.",
    icon: PhoneForwardedIcon,
  },
  {
    type: "cancel_transfer" as const,
    label: "Cancel Transfer",
    description: "Cancel an agentic warm transfer and return to the main agent.",
    icon: XCircleIcon,
  },
  {
    type: "custom" as const,
    label: "Custom Function",
    description: "Call your own API during the conversation.",
    icon: BracesIcon,
  },
]

export function GeneralToolsEditor() {
  const [tools, setTools] = React.useState(getGeneralTools)
  const [draft, setDraft] = React.useState<GeneralTool | null>(null)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null)
  const [error, setError] = React.useState("")

  function updateTools(nextTools: GeneralTool[]) {
    writeGeneralTools(nextTools)
    setTools(nextTools)
  }

  function openNew(type: GeneralTool["type"]) {
    setEditingIndex(null)
    setError("")
    setDraft(createTool(type))
  }

  function openEdit(index: number) {
    setEditingIndex(index)
    setError("")
    setDraft(coerceToolForEdit(structuredClone(tools[index])))
  }

  function saveTool() {
    if (!draft) return

    const validationError = validateTool(draft, tools, editingIndex)
    if (validationError) {
      setError(validationError)
      return
    }

    const nextDraft = normalizeTool(draft)

    const nextTools =
      editingIndex === null
        ? [...tools, nextDraft]
        : tools.map((tool, index) => (index === editingIndex ? nextDraft : tool))

    updateTools(nextTools)
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
                  updateTools(tools.filter((_, index) => index !== deleteIndex))
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
      speak_during_execution: false,
      execution_message_type: "prompt",
      execution_message_description: "",
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
        extension: "",
      },
      transfer_option: {
        type: "cold_transfer",
        show_transferee_as_caller: false,
        cold_transfer_mode: "sip_invite",
        transfer_ring_duration_ms: 30000,
      },
      custom_sip_headers: {},
      ignore_e164_validation: false,
      speak_during_execution: false,
      execution_message_type: "prompt",
      execution_message_description: "",
    } satisfies TransferCallTool
  }

  if (type === "check_availability_cal") {
    return {
      type,
      name: "check_availability",
      description: "Check available appointment times.",
      cal_api_key: "",
      event_type_id: "",
      timezone: "",
    } satisfies CheckAvailabilityCalTool
  }

  if (type === "book_appointment_cal") {
    return {
      type,
      name: "book_appointment",
      description: "Book the appointment after the user confirms a time.",
      cal_api_key: "",
      event_type_id: "",
      timezone: "",
    } satisfies BookAppointmentCalTool
  }

  if (type === "press_digit") {
    return {
      type,
      name: "press_digit",
      description: "Press a digit to navigate an IVR menu.",
      delay_ms: 1000,
    } satisfies PressDigitTool
  }

  if (type === "bridge_transfer") {
    return {
      type,
      name: "bridge_transfer",
      description: "Bridge the original caller to the transfer target.",
      speak_during_execution: false,
      execution_message_type: "prompt",
      execution_message_description: "",
    } satisfies BridgeTransferTool
  }

  if (type === "cancel_transfer") {
    return {
      type,
      name: "cancel_transfer",
      description: "Cancel the transfer and return the caller to the main agent.",
      speak_during_execution: false,
      execution_message_type: "prompt",
      execution_message_description: "",
    } satisfies CancelTransferTool
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
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(tool.name)) {
    return "Name can contain only letters, numbers, underscores, and dashes, with a maximum length of 64."
  }
  if (!tool.description.trim()) return "Description is required."
  if (tools.some((item, index) => index !== editingIndex && item.name === tool.name)) {
    return "Function names must be unique."
  }
  if (tool.type === "check_availability_cal" || tool.type === "book_appointment_cal") {
    if (!tool.cal_api_key.trim()) return "Cal.com API key is required."
    if (String(tool.event_type_id).trim() === "") return "Cal.com event type ID is required."
  }
  if (tool.type === "press_digit" && (tool.delay_ms < 0 || tool.delay_ms > 5000)) {
    return "Press digit delay must be between 0 and 5000 ms."
  }
  if (tool.type === "transfer_call") {
    if (tool.transfer_destination.type === "predefined" && !tool.transfer_destination.number.trim()) {
      return "Transfer destination is required."
    }
    if (tool.transfer_destination.type === "inferred" && !tool.transfer_destination.prompt.trim()) {
      return "Transfer destination prompt is required."
    }
    if (
      tool.transfer_option.type === "agentic_warm_transfer" &&
      !tool.transfer_option.agentic_transfer_config.transfer_agent?.agent_id.trim()
    ) {
      return "Transfer agent ID is required for agentic warm transfer."
    }
    if (
      tool.transfer_option.type === "agentic_warm_transfer" &&
      String(tool.transfer_option.agentic_transfer_config.transfer_agent?.agent_version ?? "").trim() === ""
    ) {
      return "Transfer agent version is required for agentic warm transfer."
    }
    if (
      tool.transfer_option.type !== "cold_transfer" &&
      tool.transfer_option.on_hold_music === "custom" &&
      !tool.transfer_option.custom_on_hold_music_asset_id?.trim()
    ) {
      return "Hold music asset ID is required when custom hold music is selected."
    }
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
  if (
    tool.type === "end_call" ||
    tool.type === "transfer_call" ||
    tool.type === "bridge_transfer" ||
    tool.type === "cancel_transfer"
  ) {
    const normalizedExecutionTool = {
      ...tool,
      speak_during_execution: tool.speak_during_execution ?? false,
      execution_message_type: tool.execution_message_type ?? "prompt",
      execution_message_description: tool.execution_message_description ?? "",
    }

    if (normalizedExecutionTool.type !== "transfer_call") return normalizedExecutionTool

    return normalizeTransferCallTool(normalizedExecutionTool)
  }

  if (tool.type === "check_availability_cal" || tool.type === "book_appointment_cal") {
    const eventTypeId = String(tool.event_type_id).trim()

    return {
      ...tool,
      event_type_id: /^\d+$/.test(eventTypeId) ? Number(eventTypeId) : eventTypeId,
      timezone: tool.timezone.trim(),
    }
  }

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

// ===================================================================
// ===================== TRANSFER CALL TOOL LOGIC ====================
// ===================================================================

function coerceToolForEdit(tool: GeneralTool): GeneralTool {
  if (tool.type !== "transfer_call") return tool

  return coerceTransferCallTool(tool)
}

function coerceTransferCallTool(tool: TransferCallTool): TransferCallTool {
  const legacyDestination = tool.transfer_destination as Record<string, unknown>
  const legacyOption = tool.transfer_option as Record<string, unknown>

  const transferDestination =
    legacyDestination.type === "inferred" || legacyDestination.type === "dynamic"
      ? {
        type: "inferred" as const,
        prompt: String(legacyDestination.prompt ?? legacyDestination.number ?? ""),
      }
      : {
        type: "predefined" as const,
        number: String(legacyDestination.number ?? ""),
        extension: String(legacyDestination.extension ?? ""),
      }

  return {
    ...tool,
    transfer_destination: transferDestination,
    transfer_option: coerceTransferOption(legacyOption),
    custom_sip_headers: coerceKeyValueRecord(tool.custom_sip_headers),
    ignore_e164_validation:
      tool.ignore_e164_validation ?? Boolean(legacyDestination.ignore_e164_validation),
    speak_during_execution: tool.speak_during_execution ?? false,
    execution_message_type: tool.execution_message_type ?? "prompt",
    execution_message_description: tool.execution_message_description ?? "",
  }
}

function coerceTransferOption(option: Record<string, unknown>): TransferCallTool["transfer_option"] {
  const type = option.type

  if (type === "warm_transfer") {
    const threeWayMessage = String(option.three_way_message ?? "")
    const whisperMessage = String(option.whisper_message ?? "")
    const legacyIvrOption = option.ivr_option as Record<string, unknown> | undefined
    const ivrOption =
      legacyIvrOption && typeof legacyIvrOption === "object"
        ? {
          type: "prompt" as const,
          prompt: String(legacyIvrOption.prompt ?? ""),
        }
        : option.navigate_ivr
          ? { type: "prompt" as const, prompt: "" }
          : undefined

    return {
      type,
      agent_detection_timeout_ms: Number(option.agent_detection_timeout_ms ?? option.wait_for_answer_ms ?? 30000),
      custom_on_hold_music_asset_id: String(option.custom_on_hold_music_asset_id ?? ""),
      enable_bridge_audio_cue: Boolean(option.enable_bridge_audio_cue ?? option.three_way_ringtone ?? true),
      ivr_option: ivrOption,
      on_hold_music: coerceTransferHoldMusic(option.on_hold_music),
      opt_out_human_detection: Boolean(option.opt_out_human_detection ?? false),
      private_handoff_option: whisperMessage
        ? { type: "static_message", message: whisperMessage }
        : null,
      public_handoff_option: threeWayMessage
        ? { type: "static_message", message: threeWayMessage }
        : null,
      show_transferee_as_caller: Boolean(option.show_transferee_as_caller),
      transfer_ring_duration_ms: Number(option.transfer_ring_duration_ms ?? option.ring_duration_ms ?? 30000),
    }
  }

  if (type === "agentic_warm_transfer") {
    const agenticConfig = option.agentic_transfer_config as Record<string, unknown> | undefined
    const transferAgent = agenticConfig?.transfer_agent as Record<string, unknown> | undefined
    const threeWayMessage = String(option.three_way_message ?? "")

    return {
      type,
      agentic_transfer_config: {
        action_on_timeout:
          agenticConfig?.action_on_timeout === "bridge_transfer" || option.action_on_timeout === "bridge_transfer"
            ? "bridge_transfer"
            : "cancel_transfer",
        transfer_agent: {
          agent_id: String(transferAgent?.agent_id ?? option.transfer_agent_id ?? ""),
          agent_version: String(transferAgent?.agent_version ?? ""),
        },
        transfer_timeout_ms: Number(agenticConfig?.transfer_timeout_ms ?? option.wait_for_answer_ms ?? 30000),
      },
      custom_on_hold_music_asset_id: String(option.custom_on_hold_music_asset_id ?? ""),
      enable_bridge_audio_cue: Boolean(option.enable_bridge_audio_cue ?? option.three_way_ringtone ?? true),
      on_hold_music: coerceTransferHoldMusic(option.on_hold_music),
      public_handoff_option: threeWayMessage
        ? { type: "static_message", message: threeWayMessage }
        : null,
      show_transferee_as_caller: Boolean(option.show_transferee_as_caller),
      transfer_ring_duration_ms: Number(option.transfer_ring_duration_ms ?? option.ring_duration_ms ?? 30000),
    }
  }

  return {
    type: "cold_transfer",
    cold_transfer_mode: option.cold_transfer_mode === "sip_refer" || option.sip_transfer_method === "refer"
      ? "sip_refer"
      : "sip_invite",
    show_transferee_as_caller: Boolean(option.show_transferee_as_caller),
    transfer_ring_duration_ms: Number(option.transfer_ring_duration_ms ?? option.ring_duration_ms ?? 30000),
  }
}

function coerceTransferHoldMusic(value: unknown): TransferHoldMusic {
  if (
    value === "none" ||
    value === "relaxing_sound" ||
    value === "uplifting_beats" ||
    value === "ringtone" ||
    value === "custom"
  ) {
    return value
  }

  return "ringtone"
}

function coerceKeyValueRecord(value: Record<string, string> | unknown): Record<string, string> {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter((item): item is { key: string; value: string } =>
          typeof item === "object" &&
          item !== null &&
          "key" in item &&
          "value" in item
        )
        .map((item) => [item.key, item.value])
        .filter(([key]) => key)
    )
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, itemValue]) => [key, String(itemValue)])
    )
  }

  return {}
}

function normalizeTransferCallTool(tool: TransferCallTool): TransferCallTool {
  const transferDestination = tool.transfer_destination
  const transferOption = tool.transfer_option

  return {
    ...tool,
    transfer_destination:
      transferDestination.type === "predefined"
        ? {
          type: "predefined",
          number: transferDestination.number.trim(),
          ...(transferDestination.extension?.trim() && {
            extension: transferDestination.extension.trim(),
          }),
        }
        : {
          type: "inferred",
          prompt: transferDestination.prompt.trim(),
        },
    transfer_option: normalizeTransferOption(transferOption),
    custom_sip_headers: Object.fromEntries(
      Object.entries(tool.custom_sip_headers ?? {}).filter(([key]) => key.trim())
    ),
  }
}

function normalizeTransferOption(option: TransferCallTool["transfer_option"]): TransferCallTool["transfer_option"] {
  if (option.type === "cold_transfer") {
    return {
      type: "cold_transfer",
      cold_transfer_mode: option.cold_transfer_mode ?? "sip_invite",
      show_transferee_as_caller: option.show_transferee_as_caller ?? false,
      transfer_ring_duration_ms: option.transfer_ring_duration_ms ?? 30000,
    }
  }

  if (option.type === "warm_transfer") {
    return {
      type: "warm_transfer",
      agent_detection_timeout_ms: option.agent_detection_timeout_ms ?? 30000,
      custom_on_hold_music_asset_id: option.custom_on_hold_music_asset_id ?? "",
      enable_bridge_audio_cue: option.enable_bridge_audio_cue ?? true,
      ivr_option: option.ivr_option?.prompt ? option.ivr_option : undefined,
      on_hold_music: option.on_hold_music ?? "ringtone",
      opt_out_human_detection: option.opt_out_human_detection ?? false,
      private_handoff_option: option.private_handoff_option ?? null,
      public_handoff_option: option.public_handoff_option ?? null,
      show_transferee_as_caller: option.show_transferee_as_caller ?? false,
      transfer_ring_duration_ms: option.transfer_ring_duration_ms ?? 30000,
    }
  }

  const transferAgent = option.agentic_transfer_config.transfer_agent

  return {
    type: "agentic_warm_transfer",
    agentic_transfer_config: {
      action_on_timeout: option.agentic_transfer_config.action_on_timeout ?? "cancel_transfer",
      transfer_agent: transferAgent
        ? {
          agent_id: transferAgent.agent_id.trim(),
          agent_version: String(transferAgent.agent_version).trim(),
        }
        : undefined,
      transfer_timeout_ms: option.agentic_transfer_config.transfer_timeout_ms ?? 30000,
    },
    custom_on_hold_music_asset_id: option.custom_on_hold_music_asset_id ?? "",
    enable_bridge_audio_cue: option.enable_bridge_audio_cue ?? true,
    on_hold_music: option.on_hold_music ?? "ringtone",
    public_handoff_option: option.public_handoff_option ?? null,
    show_transferee_as_caller: option.show_transferee_as_caller ?? false,
    transfer_ring_duration_ms: option.transfer_ring_duration_ms ?? 30000,
  }
}

// ===================================================================
// ====================== TRANSFER CALL TOOL END =====================
// ===================================================================


function toolLabel(type: GeneralTool["type"]) {
  return TOOL_OPTIONS.find((item) => item.type === type)?.label
}
