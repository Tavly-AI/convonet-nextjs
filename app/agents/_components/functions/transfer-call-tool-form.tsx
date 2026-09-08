"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { KeyValueEditor } from "@/app/agents/_components/shared/key-value-editor"
import type {
  ExecutionMessageFields,
  KeyValue,
  TransferCallTool,
  TransferHandoffOption,
  TransferHoldMusic,
  TransferMode,
} from "@/app/agents/_lib/functions/general-tools"
import { Section } from "../speech-settings/speech-settings"
import { COMPANY_NAME } from "@/lib/constants"

export function TransferCallForm({
  value,
  onChange,
}: {
  value: TransferCallTool
  onChange: (value: TransferCallTool) => void
}) {
  const option = value.transfer_option
  const setOption = (patch: Record<string, unknown>) =>
    onChange({ ...value, transfer_option: { ...option, ...patch } as TransferCallTool["transfer_option"] })
  const sipHeaders = keyValueFromRecord(value.custom_sip_headers)

  return (
    <>
      <Section title="Transfer destination">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination type">
            <Select
              value={value.transfer_destination.type}
              onValueChange={(type) =>
                onChange({
                  ...value,
                  transfer_destination:
                    type === "inferred"
                      ? { type: "inferred", prompt: "" }
                      : { type: "predefined", number: "", extension: "" },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="predefined">Static destination</SelectItem>
                <SelectItem value="inferred">Inferred by prompt</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {value.transfer_destination.type === "predefined" ? (
            <>
              <Field label="Phone number or SIP URI">
                <Input
                  value={value.transfer_destination.number}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      transfer_destination: {
                        type: "predefined",
                        number: event.target.value,
                        extension:
                          value.transfer_destination.type === "predefined"
                            ? value.transfer_destination.extension
                            : "",
                      },
                    })
                  }
                  placeholder="+14155551234 or {{transfer_number}}"
                />
              </Field>
              <Field label="Extension digits">
                <Input
                  value={value.transfer_destination.extension ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      transfer_destination: {
                        type: "predefined",
                        number:
                          value.transfer_destination.type === "predefined"
                            ? value.transfer_destination.number
                            : "",
                        extension: event.target.value,
                      },
                    })
                  }
                  placeholder="123# or {{extension}}"
                />
              </Field>
            </>
          ) : (
            <div className="sm:col-span-2">
              <Field label="Inference prompt">
                <Textarea
                  value={value.transfer_destination.prompt}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      transfer_destination: {
                        type: "inferred",
                        prompt: event.target.value,
                      },
                    })
                  }
                  placeholder="Infer the best transfer number from the caller's reason and available dynamic variables."
                />
              </Field>
            </div>
          )}
          <CheckRow
            label="Keep raw input"
            description="Skip E.164 number validation."
            checked={value.ignore_e164_validation ?? false}
            onCheckedChange={(checked) =>
              onChange({
                ...value,
                ignore_e164_validation: checked,
              })
            }
          />
        </div>
      </Section>

      <Section title="Transfer behavior">
        <div className="space-y-4">
          <Field label="Transfer type">
            <Select
              value={option.type}
              onValueChange={(type) => {
                onChange({
                  ...value,
                  transfer_option: createTransferOption(type as TransferMode),
                })
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold_transfer">Cold transfer</SelectItem>
                <SelectItem value="warm_transfer">Warm transfer</SelectItem>
                <SelectItem value="agentic_warm_transfer">Agentic warm transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Displayed caller ID">
              <Select
                value={option.show_transferee_as_caller ? "user" : "agent"}
                onValueChange={(caller) => setOption({ show_transferee_as_caller: caller === "user" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">${COMPANY_NAME} agent&apos;s number</SelectItem>
                  <SelectItem value="user">User&apos;s number</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <NumberField
              label="Transfer ring duration (ms)"
              value={option.transfer_ring_duration_ms ?? 30000}
              onChange={(transfer_ring_duration_ms) => setOption({ transfer_ring_duration_ms })}
            />
          </div>

          {option.type === "cold_transfer" ? (
            <Field label="Cold transfer mode">
              <Select
                value={option.cold_transfer_mode ?? "sip_invite"}
                onValueChange={(method) => setOption({ cold_transfer_mode: method })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sip_invite">SIP INVITE</SelectItem>
                  <SelectItem value="sip_refer">SIP REFER</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <WarmTransferFields value={value} onChange={onChange} />
          )}
        </div>
      </Section>

      <Section title="Custom SIP headers">
        <KeyValueEditor
          value={sipHeaders}
          onChange={(custom_sip_headers) =>
            onChange({ ...value, custom_sip_headers: recordFromKeyValue(custom_sip_headers) })
          }
          keyPlaceholder="X-Department"
          valuePlaceholder="billing"
        />
      </Section>

      <Section title="Conversation behavior">
        <ExecutionMessageForm value={value} onChange={onChange} />
      </Section>
    </>
  )
}

function createTransferOption(type: TransferMode): TransferCallTool["transfer_option"] {
  if (type === "warm_transfer") {
    return {
      type,
      agent_detection_timeout_ms: 30000,
      enable_bridge_audio_cue: true,
      on_hold_music: "ringtone",
      opt_out_human_detection: false,
      private_handoff_option: null,
      public_handoff_option: null,
      show_transferee_as_caller: false,
      transfer_ring_duration_ms: 30000,
    }
  }

  if (type === "agentic_warm_transfer") {
    return {
      type,
      agentic_transfer_config: {
        action_on_timeout: "cancel_transfer",
        transfer_agent: {
          agent_id: "",
          agent_version: "",
        },
        transfer_timeout_ms: 30000,
      },
      enable_bridge_audio_cue: true,
      on_hold_music: "ringtone",
      public_handoff_option: null,
      show_transferee_as_caller: false,
      transfer_ring_duration_ms: 30000,
    }
  }

  return {
    type,
    cold_transfer_mode: "sip_invite",
    show_transferee_as_caller: false,
    transfer_ring_duration_ms: 30000,
  }
}

function WarmTransferFields({
  value,
  onChange,
}: {
  value: TransferCallTool
  onChange: (value: TransferCallTool) => void
}) {
  const option = value.transfer_option
  if (option.type === "cold_transfer") return null

  const setOption = (patch: Record<string, unknown>) =>
    onChange({ ...value, transfer_option: { ...option, ...patch } as TransferCallTool["transfer_option"] })
  const publicHandoff = option.public_handoff_option ?? { type: "prompt" as const, prompt: "" }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="On-hold audio">
          <Select
            value={option.on_hold_music ?? "ringtone"}
            onValueChange={(music) => setOption({ on_hold_music: music as TransferHoldMusic })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ringtone">Ringtone</SelectItem>
              <SelectItem value="relaxing_sound">Relaxing sound</SelectItem>
              <SelectItem value="uplifting_beats">Uplifting beats</SelectItem>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="custom">Custom asset</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {option.on_hold_music === "custom" && (
          <Field label="Hold music asset ID">
            <Input
              value={option.custom_on_hold_music_asset_id ?? ""}
              onChange={(event) => setOption({ custom_on_hold_music_asset_id: event.target.value })}
              placeholder="asset_..."
            />
          </Field>
        )}
        <NumberField
          label="Transfer timeout (ms)"
          value={
            option.type === "agentic_warm_transfer"
              ? option.agentic_transfer_config.transfer_timeout_ms ?? 30000
              : option.agent_detection_timeout_ms ?? 30000
          }
          onChange={(timeout) => {
            if (option.type === "agentic_warm_transfer") {
              setOption({
                agentic_transfer_config: {
                  ...option.agentic_transfer_config,
                  transfer_timeout_ms: timeout,
                },
              })
            } else {
              setOption({ agent_detection_timeout_ms: timeout })
            }
          }}
        />
      </div>

      {option.type === "warm_transfer" ? (
        <>
          <CheckRow
            label="Navigate IVR"
            description="Let the agent navigate an automated phone menu."
            checked={Boolean(option.ivr_option)}
            onCheckedChange={(navigate_ivr) =>
              setOption({ ivr_option: navigate_ivr ? { type: "prompt", prompt: "" } : undefined })
            }
          />
          {option.ivr_option && (
            <Field label="IVR navigation prompt">
              <Textarea
                value={option.ivr_option.prompt ?? ""}
                onChange={(event) =>
                  setOption({ ivr_option: { type: "prompt", prompt: event.target.value } })
                }
                placeholder="Guide the agent through the IVR menu before human detection."
              />
            </Field>
          )}
          <CheckRow
            label="Skip human detection"
            description="Bridge without waiting to detect a human agent."
            checked={option.opt_out_human_detection ?? false}
            onCheckedChange={(opt_out_human_detection) => setOption({ opt_out_human_detection })}
          />
          <HandoffOptionField
            label="Private handoff"
            value={option.private_handoff_option ?? null}
            onChange={(private_handoff_option) => setOption({ private_handoff_option })}
          />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transfer agent ID">
            <Input
              value={option.agentic_transfer_config.transfer_agent?.agent_id ?? ""}
              onChange={(event) =>
                setOption({
                  agentic_transfer_config: {
                    ...option.agentic_transfer_config,
                    transfer_agent: {
                      agent_id: event.target.value,
                      agent_version:
                        option.agentic_transfer_config.transfer_agent?.agent_version ?? "",
                    },
                  },
                })
              }
              placeholder="agent_..."
            />
          </Field>
          <Field label="Transfer agent version">
            <Input
              value={String(option.agentic_transfer_config.transfer_agent?.agent_version ?? "")}
              onChange={(event) =>
                setOption({
                  agentic_transfer_config: {
                    ...option.agentic_transfer_config,
                    transfer_agent: {
                      agent_id: option.agentic_transfer_config.transfer_agent?.agent_id ?? "",
                      agent_version: event.target.value,
                    },
                  },
                })
              }
              placeholder="1"
            />
          </Field>
          <Field label="Action on timeout">
            <Select
              value={option.agentic_transfer_config.action_on_timeout ?? "cancel_transfer"}
              onValueChange={(action) =>
                setOption({
                  agentic_transfer_config: {
                    ...option.agentic_transfer_config,
                    action_on_timeout: action as "cancel_transfer" | "bridge_transfer",
                  },
                })
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cancel_transfer">Cancel transfer</SelectItem>
                <SelectItem value="bridge_transfer">Bridge transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      <CheckRow
        label="Bridge audio cue"
        description="Play an audio cue when bridging the call."
        checked={option.enable_bridge_audio_cue ?? true}
        onCheckedChange={(enable_bridge_audio_cue) => setOption({ enable_bridge_audio_cue })}
      />
      <HandoffOptionField
        label="Public handoff"
        value={publicHandoff}
        onChange={(public_handoff_option) => setOption({ public_handoff_option })}
      />
    </div>
  )
}

function HandoffOptionField({
  label,
  value,
  onChange,
}: {
  label: string
  value: TransferHandoffOption | null
  onChange: (value: TransferHandoffOption | null) => void
}) {
  const mode = value?.type ?? "none"

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <Field label={label}>
        <Select
          value={mode}
          onValueChange={(nextMode) => {
            if (nextMode === "none") onChange(null)
            if (nextMode === "prompt") onChange({ type: "prompt", prompt: "" })
            if (nextMode === "static_message") onChange({ type: "static_message", message: "" })
          }}
        >
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="prompt">Prompt</SelectItem>
            <SelectItem value="static_message">Static message</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {value?.type === "prompt" && (
        <Textarea
          value={value.prompt}
          onChange={(event) => onChange({ ...value, prompt: event.target.value })}
          placeholder="Prompt for the handoff message."
        />
      )}
      {value?.type === "static_message" && (
        <Textarea
          value={value.message}
          onChange={(event) => onChange({ ...value, message: event.target.value })}
          placeholder="Message to say during handoff."
        />
      )}
    </div>
  )
}

function ExecutionMessageForm<T extends ExecutionMessageFields>({
  value,
  onChange,
}: {
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-4">
      <CheckRow
        label="Talk while running"
        description="Say something when this tool is called."
        checked={value.speak_during_execution ?? false}
        onCheckedChange={(speak_during_execution) =>
          onChange({ ...value, speak_during_execution })
        }
      />
      {value.speak_during_execution && (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Message type">
            <Select
              value={value.execution_message_type ?? "prompt"}
              onValueChange={(execution_message_type) =>
                onChange({
                  ...value,
                  execution_message_type: execution_message_type as ExecutionMessageFields["execution_message_type"],
                })
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="static_text">Static sentence</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Message">
            <Textarea
              value={value.execution_message_description ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  execution_message_description: event.target.value,
                })
              }
              placeholder="Let me connect you now."
            />
          </Field>
        </div>
      )}
    </div>
  )
}

function keyValueFromRecord(value: Record<string, string> | KeyValue[] | undefined) {
  if (Array.isArray(value)) return value
  return Object.entries(value ?? {}).map(([key, itemValue]) => ({ key, value: itemValue }))
}

function recordFromKeyValue(value: KeyValue[]): Record<string, string> {
  return Object.fromEntries(value.map(({ key, value: itemValue }) => [key, itemValue]))
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  )
}

function CheckRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border p-3">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} />
      <span className="grid gap-1 text-sm">
        <span className="font-medium">{label}</span>
        {description && <span className="text-muted-foreground">{description}</span>}
      </span>
    </label>
  )
}
