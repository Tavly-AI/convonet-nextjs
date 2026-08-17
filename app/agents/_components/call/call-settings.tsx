"use client"

import * as React from "react"
import { ChevronDownIcon, MinusIcon, PlusIcon } from "lucide-react"

import type {
  CallScreeningOption,
  CallSettings as CallSettingsConfig,
  IvrOption,
  UserDtmfOptions,
  VoicemailAction,
  VoicemailOption,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
  DEFAULT_CALL_SETTINGS,
  DEFAULT_USER_DTMF_OPTIONS,
  getCallSettings,
  writeCallSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { Section } from "../speech-settings/speech-settings"

const TERMINATION_KEYS = ["#", "*", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

type VoicemailMessageAction = "prompt" | "static_text"

const EMPTY_VOICEMAIL_OPTION = {
  action: {
    type: "static_text",
    text: "",
  },
  detection_prompt: null,
} satisfies NonNullable<VoicemailOption>

const EMPTY_IVR_OPTION = {
  action: {
    type: "hangup",
  },
  detection_prompt: null,
} satisfies NonNullable<IvrOption>

const EMPTY_CALL_SCREENING_OPTION = {
  agent_identity: "",
  call_purpose: "",
} satisfies NonNullable<CallScreeningOption>

export function CallSettings() {
  const [settings, setSettings] = React.useState<CallSettingsConfig>(() => {
    const storedSettings = getCallSettings()

    return {
      ...DEFAULT_CALL_SETTINGS,
      ...storedSettings,
      user_dtmf_options: {
        ...DEFAULT_USER_DTMF_OPTIONS,
        ...storedSettings.user_dtmf_options,
      },
    }
  })

  function updateSettings(patch: Partial<CallSettingsConfig>) {
    const nextSettings = { ...settings, ...patch }

    setSettings(nextSettings)
    writeCallSettings(patch)
  }

  function updateDtmfOptions(patch: Partial<UserDtmfOptions>) {
    updateSettings({
      user_dtmf_options: {
        ...settings.user_dtmf_options,
        ...patch,
      },
    })
  }

  function updateVoicemailAction(action: VoicemailAction) {
    updateSettings({
      voicemail_option: {
        ...(settings.voicemail_option ?? EMPTY_VOICEMAIL_OPTION),
        action,
      },
    })
  }

  function updateVoicemailDetectionPrompt(detection_prompt: string) {
    updateSettings({
      voicemail_option: {
        ...(settings.voicemail_option ?? EMPTY_VOICEMAIL_OPTION),
        detection_prompt: detection_prompt || null,
      },
    })
  }

  return (
    <div className="space-y-8 border-t px-5 py-6 bg-gray-400/10 rounded-3xl">
      <Section
        title=""
        description=""
      >
        <div className="space-y-4">
          <SettingBlock
            label="Voicemail Detection"
            description="Hang up or leave a voicemail if a voicemail is detected."
            pressed={settings.voicemail_option != null}
            onPressedChange={(pressed) =>
              updateSettings({
                voicemail_option: pressed ? EMPTY_VOICEMAIL_OPTION : null,
              })
            }
          >
            {settings.voicemail_option && (
              <VoicemailPanel
                action={settings.voicemail_option.action}
                detectionPrompt={settings.voicemail_option.detection_prompt ?? ""}
                onActionChange={updateVoicemailAction}
                onDetectionPromptChange={updateVoicemailDetectionPrompt}
              />
            )}
          </SettingBlock>

          <SettingBlock
            label="iOS / Android Call Screen Handling"
            description="Use a predefined identity and purpose when call screening picks up."
            pressed={settings.call_screening_option != null}
            onPressedChange={(pressed) =>
              updateSettings({
                call_screening_option: pressed
                  ? EMPTY_CALL_SCREENING_OPTION
                  : null,
              })
            }
          >
            {settings.call_screening_option && (
              <ConfigPanel>
                <TextField
                  label="Agent identity"
                  value={settings.call_screening_option.agent_identity}
                  placeholder="e.g. Retell AI scheduling team"
                  onChange={(agent_identity) =>
                    updateSettings({
                      call_screening_option: {
                        ...EMPTY_CALL_SCREENING_OPTION,
                        ...settings.call_screening_option,
                        agent_identity,
                      },
                    })
                  }
                />
                <TextareaField
                  label="Purpose of the call"
                  value={settings.call_screening_option.call_purpose}
                  placeholder="e.g. confirming your appointment for tomorrow. Type {{ to add dynamic variables"
                  onChange={(call_purpose) =>
                    updateSettings({
                      call_screening_option: {
                        ...EMPTY_CALL_SCREENING_OPTION,
                        ...settings.call_screening_option,
                        call_purpose,
                      },
                    })
                  }
                />
              </ConfigPanel>
            )}
          </SettingBlock>

          <SettingBlock
            label="IVR Hangup"
            description="Hang up if an IVR system is detected."
            pressed={settings.ivr_option != null}
            onPressedChange={(pressed) =>
              updateSettings({
                ivr_option: pressed ? EMPTY_IVR_OPTION : null,
              })
            }
          />
        </div>
      </Section>

      <Section
        title=""
        description=""
      >
        <div className="space-y-4">
          <SettingBlock
            label="Enable keypad input"
            description="The AI responds when timeout, termination key, or digit limit is reached."
            pressed={settings.allow_user_dtmf}
            onPressedChange={(allow_user_dtmf) =>
              updateSettings({
                allow_user_dtmf,
                user_dtmf_options: settings.user_dtmf_options ?? DEFAULT_USER_DTMF_OPTIONS,
              })
            }
          >
            {settings.allow_user_dtmf && (
              <div className="mt-4 grid gap-4 rounded-lg border bg-background/60 p-4">
                <DurationSlider
                  label="Timeout"
                  value={settings.user_dtmf_options.timeout_ms}
                  min={1000}
                  max={30000}
                  step={500}
                  minLabel="1 s"
                  maxLabel="30 s"
                  formatValue={(value) => formatSeconds(value)}
                  onChange={(timeout_ms) => updateDtmfOptions({ timeout_ms })}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Termination Key</Label>
                    <Select
                      value={settings.user_dtmf_options.termination_key}
                      onValueChange={(termination_key) =>
                        updateDtmfOptions({
                          termination_key:
                            termination_key ?? DEFAULT_USER_DTMF_OPTIONS.termination_key,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TERMINATION_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <CounterField
                    label="Digit Limit"
                    value={settings.user_dtmf_options.digit_limit}
                    min={1}
                    max={50}
                    onChange={(digit_limit) => updateDtmfOptions({ digit_limit })}
                  />
                </div>
              </div>
            )}
          </SettingBlock>
        </div>
      </Section>

      <Section
        title="Call Duration"
        description="Control silence handling, call length, and ringing timeout."
      >
        <div className="space-y-5">
          <DurationSlider
            label="End Call on Silence"
            value={settings.end_call_after_silence_ms}
            min={10000}
            max={900000}
            step={10000}
            minLabel="10 s"
            maxLabel="15 m"
            formatValue={(value) => formatMinutes(value)}
            onChange={(end_call_after_silence_ms) =>
              updateSettings({ end_call_after_silence_ms })
            }
          />
          <DurationSlider
            label="Max Call Duration"
            value={settings.max_call_duration_ms}
            min={60000}
            max={7200000}
            step={60000}
            minLabel="1 m"
            maxLabel="2 h"
            formatValue={(value) => formatHours(value)}
            onChange={(max_call_duration_ms) =>
              updateSettings({ max_call_duration_ms })
            }
          />
          <DurationSlider
            label="Ring Duration"
            value={settings.ring_duration_ms}
            min={5000}
            max={300000}
            step={5000}
            minLabel="5 s"
            maxLabel="5 m"
            formatValue={(value) => formatSeconds(value)}
            onChange={(ring_duration_ms) => updateSettings({ ring_duration_ms })}
          />
        </div>
      </Section>
    </div>
  )
}


// MISC CODE

function VoicemailPanel({
  action,
  detectionPrompt,
  onActionChange,
  onDetectionPromptChange,
}: {
  action: VoicemailAction
  detectionPrompt: string
  onActionChange: (action: VoicemailAction) => void
  onDetectionPromptChange: (value: string) => void
}) {
  const messageActionType = isVoicemailMessageAction(action.type)
    ? action.type
    : EMPTY_VOICEMAIL_OPTION.action.type
  const messageText = "text" in action ? action.text : EMPTY_VOICEMAIL_OPTION.action.text

  function setResponseType(responseType: "hangup" | "message") {
    if (responseType === "hangup") {
      onActionChange({ type: "hangup" })
      return
    }

    onActionChange({ type: messageActionType, text: messageText })
  }

  function setMessageActionType(type: VoicemailMessageAction) {
    onActionChange({ type, text: messageText })
  }

  return (
    <ConfigPanel>
      <h4 className="font-medium">Voicemail Response</h4>
      <div className="space-y-3">
        <RadioOption
          label="Hang up if reaching voicemail"
          checked={action.type === "hangup"}
          onChange={() => setResponseType("hangup")}
        />
        <RadioOption
          label="Leave a message if reaching voicemail"
          checked={isVoicemailMessageAction(action.type)}
          onChange={() => setResponseType("message")}
        />
      </div>

      {isVoicemailMessageAction(action.type) && (
        <div className="space-y-4">
          <SegmentedControl
            value={messageActionType}
            options={[
              { value: "prompt", label: "Prompt" },
              { value: "static_text", label: "Static Sentence" },
            ]}
            onChange={setMessageActionType}
          />
          <Textarea
            value={messageText}
            onChange={(event) =>
              onActionChange({ type: messageActionType, text: event.target.value })
            }
            className="min-h-32 bg-background text-base"
            placeholder="Hey {{user_name}}, sorry we could not reach you directly. Please give us a callback if you can."
          />
        </div>
      )}

      <AdvancedDisclosure>
        <TextareaField
          label="Detection Prompt"
          value={detectionPrompt}
          placeholder="Optionally describe what should be treated as voicemail."
          onChange={onDetectionPromptChange}
        />
      </AdvancedDisclosure>
    </ConfigPanel>
  )
}


function SettingBlock({
  label,
  description,
  pressed,
  onPressedChange,
  children,
}: {
  label: string
  description: string
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <div className="">
      <div className="space-y-2">
        <div>
          <Label className="text-sm font-medium leading-normal">{label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <SwitchToggle pressed={pressed} onPressedChange={onPressedChange} label={label} />
      </div>
      {pressed && children}
    </div>
  )
}

function SwitchToggle({
  pressed,
  onPressedChange,
  label,
}: {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  label: string
}) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={label}
      className="h-5 w-8 justify-start rounded-full border bg-muted p-0.5 hover:bg-muted aria-pressed:justify-end aria-pressed:bg-slate-700 aria-pressed:border-0"
    >
      <span className="size-4 rounded-full bg-background shadow-sm" />
    </Toggle>
  )
}

function ConfigPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 grid gap-4 rounded-lg border bg-background/60 p-4">
      {children}
    </div>
  )
}

function RadioOption({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <Label className="flex items-start gap-3 font-normal text-muted-foreground">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 size-4 accent-slate-700"
      />
      <span>{label}</span>
    </Label>
  )
}

function SegmentedControl<TValue extends string>({
  value,
  options,
  onChange,
}: {
  value: TValue
  options: { value: TValue; label: string }[]
  onChange: (value: TValue) => void
}) {
  return (
    <div className="inline-flex rounded-xl border bg-background p-1 gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            "h-9 rounded-lg px-3 text-sm text-muted-foreground transition-colors",
            value === option.value && "bg-background text-foreground shadow-sm ring-1 ring-foreground/10"
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        className="h-10 bg-background"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function TextareaField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        placeholder={placeholder}
        className="bg-background"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function AdvancedDisclosure({ children }: { children: React.ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1 text-sm text-muted-foreground">
        Advance Setting
        <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}

function DurationSlider({
  label,
  value,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  formatValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  minLabel: string
  maxLabel: string
  formatValue: (value: number) => string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Label className="text-sm leading-normal">{label}</Label>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {formatValue(value)}
        </Badge>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(nextValue) => {
          const numberValue = Array.isArray(nextValue) ? nextValue[0] : nextValue
          onChange(numberValue)
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

function CounterField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex h-9 items-center rounded-lg border bg-background">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Decrease digit limit"
          disabled={value <= min}
          onClick={() => onChange(clamp(Number((value - 1).toFixed(1)), min, max))}
        >
          <MinusIcon />
        </Button>
        <div className="min-w-0 flex-1 text-center font-mono text-sm">
          {formatNumber(value)}
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Increase digit limit"
          disabled={value >= max}
          onClick={() => onChange(clamp(Number((value + 1).toFixed(1)), min, max))}
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  )
}

function formatSeconds(value: number) {
  return `${formatNumber(value / 1000)} s`
}

function formatMinutes(value: number) {
  return `${formatNumber(value / 60000)} m`
}

function formatHours(value: number) {
  return `${formatNumber(value / 3600000)} h`
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function isVoicemailMessageAction(
  type: VoicemailAction["type"]
): type is VoicemailMessageAction {
  return type === "prompt" || type === "static_text"
}
