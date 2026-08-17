"use client"

import * as React from "react"

import type {
  DenoisingMode,
  RealtimeTranscriptionSettings as RealtimeTranscriptionSettingsConfig,
  SttMode,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
  getRealtimeTranscriptionSettings,
  writeRealtimeTranscriptionSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field } from "../functions/general-tool-form"
import { Section } from "../speech-settings/speech-settings"

const DEFAULT_SETTINGS = {
  denoising_mode: "noise-cancellation",
  stt_mode: "fast",
  custom_stt_config: null,
  boosted_keywords: [],
} satisfies RealtimeTranscriptionSettingsConfig

const DENOISING_OPTIONS: { value: DenoisingMode; label: string }[] = [
  { value: "noise-cancellation", label: "Remove noise" },
  {
    value: "noise-and-background-speech-cancellation",
    label: "Remove noise + background speech",
  },
  { value: "no-denoise", label: "No denoising" },
]

const STT_OPTIONS: { value: SttMode; label: string; hint?: string }[] = [
  { value: "fast", label: "Optimize for speed", hint: "Provider Config" },
  { value: "accurate", label: "Optimize for accuracy", hint: "Provider Config" },
  { value: "custom", label: "Custom Settings" },
]

export function RealtimeTranscriptionSettings() {
  const [settings, setSettings] =
    React.useState<RealtimeTranscriptionSettingsConfig>(() => ({
      ...DEFAULT_SETTINGS,
      ...getRealtimeTranscriptionSettings(),
    }))
  const [keywords, setKeywords] = React.useState(() =>
    settings.boosted_keywords.join(", ")
  )

  function updateSettings(patch: Partial<RealtimeTranscriptionSettingsConfig>) {
    setSettings((current) => ({ ...current, ...patch }))
    writeRealtimeTranscriptionSettings(patch)
  }

  return (
    <div className="space-y-8 border-t px-5 py-6 bg-gray-400/10 rounded-3xl">
      <Section
        title="Denoising Mode"
        description="Filter out unwanted background noise or speech."
      >
        <div className="space-y-3">
          {DENOISING_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              name="denoising_mode"
              label={option.label}
              checked={settings.denoising_mode === option.value}
              onChange={() => updateSettings({ denoising_mode: option.value })}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Transcription Mode"
        description="Balance between speed and accuracy."
      >
        <div className="space-y-3">
          {STT_OPTIONS.map((option) => (
            <RadioRow
              key={option.value}
              name="stt_mode"
              label={option.label}
              hint={option.hint}
              checked={settings.stt_mode === option.value}
              onChange={() =>
                updateSettings({
                  stt_mode: option.value,
                  custom_stt_config:
                    option.value === "custom"
                      ? settings.custom_stt_config ?? { endpointing_ms: 500 }
                      : settings.custom_stt_config,
                })
              }
            />
          ))}
        </div>

        {settings.stt_mode === "custom" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Provider">
              <Input
                value={settings.custom_stt_config?.provider ?? ""}
                onChange={(event) =>
                  updateSettings({
                    custom_stt_config: {
                      ...(settings.custom_stt_config ?? {}),
                      provider: event.target.value || undefined,
                    },
                  })
                }
                placeholder="azure"
              />
            </Field>
            <Field label="Endpointing ms">
              <Input
                type="number"
                min={0}
                value={settings.custom_stt_config?.endpointing_ms ?? ""}
                onChange={(event) =>
                  updateSettings({
                    custom_stt_config: {
                      ...(settings.custom_stt_config ?? {}),
                      endpointing_ms: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    },
                  })
                }
                placeholder="500"
              />
            </Field>
          </div>
        )}
      </Section>

      <Section
        title="Boosted Keywords"
        description="Provide a customized list of keywords to expand our models' vocabulary."
      >
        <Input
          value={keywords}
          onChange={(event) => {
            const value = event.target.value

            setKeywords(value)
            updateSettings({
              boosted_keywords: value
                .split(",")
                .map((keyword) => keyword.trim())
                .filter(Boolean),
            })
          }}
          placeholder="Split by comma. Example: Retell, Walmart"
        />
      </Section>
    </div>
  )
}

function RadioRow({
  name,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <Label className="flex items-center gap-3 font-normal text-muted-foreground">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="size-4 accent-foreground"
      />
      <span>{label}</span>
      {hint && <span className="border-b text-sm">{hint}</span>}
    </Label>
  )
}
