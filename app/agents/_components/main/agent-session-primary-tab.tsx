"use client"

import * as React from "react"
import {
  GaugeIcon,
  SquareStackIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { VoiceModalPopup } from "../voice/voice-modal-popup"
import { AgentHandbookDialog } from "./agent-session-handbook"
import { LanguageSelect } from "./agent-session-language"
import { LLMModelSelect } from "./agent-session-model"
import { GeneralPrompt } from "./agent-session-prompt"
import { AgentSessionStartSpeaker } from "./agent-session-start-speaker"
import { TimezoneSelect } from "./agent-session-timezone"
import { AgentSessionPrimaryUpperbar } from "./agent-session-primary-upperbar"


export function AgentSessionPrimaryTab({ isConversationalFlow }: { isConversationalFlow?: boolean }) {

  const [voiceOpen, setVoiceOpen] = React.useState(false)

  return (
    <Card className="max-h-[91vh] min-h-0 overflow-y-auto gap-0 py-0">
      <div className="flex min-h-full flex-col">

        {!isConversationalFlow && <AgentSessionPrimaryUpperbar />}

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">

          <LLMModelSelect />

          <VoiceModalPopup open={voiceOpen} onOpenChange={open => setVoiceOpen(open)} />

          <LanguageSelect />

          <div className="ml-auto flex items-center gap-2">
            <AgentHandbookDialog />

            <TimezoneSelect />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <GeneralPrompt />
          <AgentSessionStartSpeaker />
        </div>
      </div>
    </Card>
  )
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      {Icon ? <Icon className="size-3.5" /> : null}
      <span>{label}</span>
      {value ? (
        <span className="border-b border-dotted border-foreground/60 font-medium text-foreground">
          {value}
        </span>
      ) : null}
    </div>
  )
}
