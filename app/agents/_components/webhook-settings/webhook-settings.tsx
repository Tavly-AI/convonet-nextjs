"use client"

import * as React from "react"
import { ExternalLinkIcon, SendIcon } from "lucide-react"

import type {
  WebhookEvent,
  WebhookSettings as WebhookSettingsConfig,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
  DEFAULT_WEBHOOK_SETTINGS,
  getWebhookSettings,
  writeWebhookSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Field } from "../functions/general-tool-form"
import { Section } from "../speech-settings/speech-settings"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { COMPANY_NAME } from "@/lib/constants"

const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  {
    value: "call_started",
    label: "Call Started",
    description: "Receive an event when a call begins.",
  },
  {
    value: "call_ended",
    label: "Call Ended",
    description: "Receive an event when a call finishes.",
  },
  {
    value: "call_analyzed",
    label: "Call Analyzed",
    description: "Receive post-call analysis results.",
  },
  {
    value: "transcript_updated",
    label: "Transcript Updated",
    description: "Receive transcript updates during the call.",
  },
  {
    value: "transfer_started",
    label: "Transfer Started",
    description: "Receive an event when call transfer starts.",
  },
  {
    value: "transfer_bridged",
    label: "Transfer Bridged",
    description: "Receive an event when transfer connects.",
  },
  {
    value: "transfer_cancelled",
    label: "Transfer Cancelled",
    description: "Receive an event when transfer is cancelled.",
  },
  {
    value: "transfer_ended",
    label: "Transfer Ended",
    description: "Receive an event when transfer ends.",
  },
]

export function WebhookSettings() {
  const [settings, setSettings] = React.useState<WebhookSettingsConfig>(() => {
    const storedSettings = getWebhookSettings()

    return {
      ...DEFAULT_WEBHOOK_SETTINGS,
      ...storedSettings,
      webhook_events: Array.isArray(storedSettings.webhook_events)
        ? storedSettings.webhook_events as WebhookEvent[]
        : DEFAULT_WEBHOOK_SETTINGS.webhook_events,
    }
  })

  function updateSettings(patch: Partial<WebhookSettingsConfig>) {
    const nextSettings = { ...settings, ...patch }

    setSettings(nextSettings)
    writeWebhookSettings(patch)
  }

  function toggleEvent(event: WebhookEvent, checked: boolean) {
    updateSettings({
      webhook_events: checked
        ? [...settings.webhook_events, event]
        : settings.webhook_events.filter((currentEvent) => currentEvent !== event),
    })
  }

  return (
    <div className="space-y-8 border-t px-5 py-6 bg-gray-400/10 rounded-3xl">
      <Section
        title="Agent Level Webhook URL"
        description={`Webhook URL to receive events from ${COMPANY_NAME}.`}
      >
        <div className="grid gap-3">
          <Field label="">
            <div className="flex gap-2">
              <Input
                type="url"
                value={settings.webhook_url ?? ""}
                onChange={(event) => {
                  const value = event.target.value.trim()

                  updateSettings({ webhook_url: value || null })
                }}
                placeholder="https://webhook-url-here"
                className="bg-background"
              />
              <Button
                type="button"
                variant="outline"
                disabled
                title="Webhook test endpoint is not configured"
              >
                <SendIcon data-icon="inline-start" />
                Test
              </Button>
            </div>
          </Field>
          <a
            href="#"
            className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Learn more
            <ExternalLinkIcon className="size-3" />
          </a>
        </div>
      </Section>

      <Section
        title="Webhook Timeout"
        description="Set the maximum time to wait for a webhook response before timing out."
      >
        <DurationSlider
          value={settings.webhook_timeout_ms}
          min={1000}
          max={30000}
          step={1000}
          onChange={(webhook_timeout_ms) => updateSettings({ webhook_timeout_ms })}
        />
      </Section>


      <Section
        title="Webhook Events"
        description="Choose which events this webhook should receive."
      >
        <WebhookEvents
          events={settings.webhook_events}
          onToggle={toggleEvent}
        />
      </Section>
    </div>
  )
}


function WebhookEvents({
  events,
  onToggle,
}: {
  events: WebhookEvent[]
  onToggle: (event: WebhookEvent, checked: boolean) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {WEBHOOK_EVENTS.map((event, index) => {
        const checked = events.includes(event.value)

        return (
          <React.Fragment key={event.value}>
            <button
              type="button"
              onClick={() => onToggle(event.value, !checked)}
              className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={checked}
                tabIndex={-1}
                className="pointer-events-none mt-0.5"
              />

              <div className="grid flex-1 gap-1">
                <span className="text-sm font-medium">
                  {event.label}
                </span>

                <span className="text-xs leading-relaxed text-muted-foreground">
                  {event.description}
                </span>
              </div>
            </button>

            {index < WEBHOOK_EVENTS.length - 1 && <Separator />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function DurationSlider({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Label className="text-sm leading-normal">Timeout</Label>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {formatSeconds(value)}
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
        <span>{formatSeconds(min)}</span>
        <span>{formatSeconds(max)}</span>
      </div>
    </div>
  )
}

function formatSeconds(value: number) {
  return `${formatNumber(value / 1000)} s`
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
