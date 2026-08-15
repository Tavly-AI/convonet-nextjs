"use client"

import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import type {
  PronunciationDictionaryEntry,
  SpeechSettings as SpeechSettingsConfig,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
  getSpeechSettings,
  writeSpeechSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Slider } from "@/components/ui/slider"

const DEFAULT_SETTINGS = {
  ambient_sound: "none",
  responsiveness: 0.84,
  enable_dynamic_responsiveness: false,
  interruption_sensitivity: 0.9,
  reminder_trigger_ms: 10000,
  reminder_max_count: 1,
  pronunciation_dictionary: [],
} satisfies SpeechSettingsConfig

const BACKGROUND_SOUND_OPTIONS = [
  { value: "none", label: "None" },
  { value: "office", label: "Office" },
  { value: "cafe", label: "Cafe" },
  { value: "call_center", label: "Call Center" },
  { value: "street", label: "Street" },
  { value: "restaurant", label: "Restaurant" },
  { value: "airport", label: "Airport" },
  { value: "keyboard", label: "Keyboard Typing" },
  { value: "rain", label: "Rain" },
  { value: "white_noise", label: "White Noise" },
] as const

const ALPHABETS = [
  { value: "ipa", label: "IPA" },
  { value: "pinyin", label: "PINYIN" },
  { value: "jyutping", label: "JYUTPING" },
] as const

export function SpeechSettings() {
  const [settings, setSettings] = React.useState<SpeechSettingsConfig>(() => {
    const storedSettings = getSpeechSettings()

    return {
      ...DEFAULT_SETTINGS,
      ...storedSettings,
      pronunciation_dictionary: Array.isArray(storedSettings.pronunciation_dictionary)
        ? storedSettings.pronunciation_dictionary as PronunciationDictionaryEntry[]
        : DEFAULT_SETTINGS.pronunciation_dictionary,
    } as SpeechSettingsConfig
  })

  function updateSettings(patch: Partial<SpeechSettingsConfig>) {
    const nextSettings = { ...settings, ...patch }

    setSettings(nextSettings)
    writeSpeechSettings(patch)
  }

  const reminderSeconds = Math.round(settings.reminder_trigger_ms / 1000)

  return (
    <div className="space-y-5 border-t px-1 py-4">
      <Section title="Background Sound" description="Add subtle background audio to make calls feel more natural.">
        <Field label="">
          <Select
            value={settings.ambient_sound}
            onValueChange={(ambient_sound) =>
              updateSettings({ ambient_sound: ambient_sound ?? DEFAULT_SETTINGS.ambient_sound })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_SOUND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Response Eagerness" description="Control how quickly the agent responds after the user stops speaking.">
        <div className="space-y-3">
          <SliderField
            label=""
            value={settings.responsiveness}
            min={0}
            max={1}
            step={0.01}
            minLabel="patient"
            maxLabel="eager"
            onChange={(responsiveness) => updateSettings({ responsiveness })}
          />
          <CheckRow
            label="Dynamically adjust based on user input"
            checked={settings.enable_dynamic_responsiveness}
            onCheckedChange={(enable_dynamic_responsiveness) =>
              updateSettings({ enable_dynamic_responsiveness })
            }
          />
        </div>
      </Section>

      <Section title="Interruption Sensitivity" description="How quickly the agent stops when user talks over it.">
        <SliderField
          label=""
          value={settings.interruption_sensitivity}
          min={0}
          max={1}
          step={0.01}
          minLabel="blocks interruption"
          maxLabel="stops immediately"
          onChange={(interruption_sensitivity) =>
            updateSettings({ interruption_sensitivity })
          }
        />
      </Section>

      <Section title="Reminder Message Frequency" description="Control how often AI will send a reminder message.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Seconds">
            <Input
              type="number"
              min={0}
              value={reminderSeconds}
              onChange={(event) =>
                updateSettings({ reminder_trigger_ms: Number(event.target.value) * 1000 })
              }
            />
          </Field>
          <Field label="Times">
            <Input
              type="number"
              min={0}
              value={settings.reminder_max_count}
              onChange={(event) =>
                updateSettings({ reminder_max_count: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      </Section>

      <Section title="Pronunciation">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Guide the model to pronounce a word, name, or phrase in a specific way.
          </p>
          <PronunciationEditor
            value={settings.pronunciation_dictionary}
            onChange={(pronunciation_dictionary) =>
              updateSettings({ pronunciation_dictionary })
            }
          />
        </div>
      </Section>
    </div>
  )
}

function PronunciationEditor({
  value,
  onChange,
}: {
  value: PronunciationDictionaryEntry[]
  onChange: (value: PronunciationDictionaryEntry[]) => void
}) {
  return (
    <div className="space-y-3">
      {value.map((entry, index) => (
        <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_8rem_auto]">
          <Input
            value={entry.word}
            onChange={(event) =>
              onChange(value.map((item, itemIndex) =>
                itemIndex === index ? { ...item, word: event.target.value } : item
              ))
            }
            placeholder="Word or phrase"
          />
          <Select
            value={entry.alphabet}
            onValueChange={(alphabet) =>
              onChange(value.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                    ...item,
                    alphabet: (alphabet ?? "ipa") as PronunciationDictionaryEntry["alphabet"],
                  }
                  : item
              ))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALPHABETS.map((alphabet) => (
                <SelectItem key={alphabet.value} value={alphabet.value}>
                  {alphabet.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove pronunciation"
            onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2Icon />
          </Button>
          <Input
            className="sm:col-span-2"
            value={entry.phoneme}
            onChange={(event) =>
              onChange(value.map((item, itemIndex) =>
                itemIndex === index ? { ...item, phoneme: event.target.value } : item
              ))
            }
            placeholder="Phoneme"
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...value, { word: "", alphabet: "ipa", phoneme: "" }])}
      >
        <PlusIcon data-icon="inline-start" />
        Add pronunciation
      </Button>
    </div>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0">
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
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

function CheckRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Label className="items-start rounded-lg border p-3 leading-normal font-normal">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(Boolean(next))}
        className="mt-0.5"
      />
      <span className="block font-medium">{label}</span>
    </Label>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Label className="leading-normal">{label}</Label>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {value.toFixed(2)}
        </Badge>
      </div>
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(nextValue) => {
          const numberValue = Array.isArray(nextValue) ? nextValue[0] : nextValue
          onChange(Number(numberValue.toFixed(2)))
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}
