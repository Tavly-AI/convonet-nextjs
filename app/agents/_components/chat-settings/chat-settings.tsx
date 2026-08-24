"use client"

import * as React from "react"

import type { ChatSettings as ChatSettingsConfig } from "@/app/agents/_lib/session-storage/agent-session"
import {
  DEFAULT_CHAT_SETTINGS,
  getChatSettings,
  writeChatSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "../functions/general-tool-form"
import { Section } from "../speech-settings/speech-settings"

export function ChatSettings() {
  const [settings, setSettings] = React.useState<ChatSettingsConfig>(() => ({
    ...DEFAULT_CHAT_SETTINGS,
    ...getChatSettings(),
  }))

  function updateSettings(patch: Partial<ChatSettingsConfig>) {
    const nextSettings = { ...settings, ...patch }

    setSettings(nextSettings)
    writeChatSettings(patch)
  }

  return (
    <div className="space-y-8 border-t px-5 py-6 bg-gray-400/10 rounded-3xl">
      <Section
        title="Auto-Close Message"
        description="Message to display when the chat is automatically closed."
      >
        <Field label="">
          <Textarea
            value={settings.auto_close_message ?? ""}
            onChange={(event) => {
              const value = event.target.value

              updateSettings({ auto_close_message: value || null })
            }}
            placeholder={DEFAULT_CHAT_SETTINGS.auto_close_message}
            className="min-h-28 bg-background text-base"
          />
        </Field>
      </Section>
    </div>
  )
}
