"use client"

import * as React from "react"
import {
  BotIcon,
  Clock3Icon,
  GaugeIcon,
  SquareStackIcon,
  WalletCardsIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { VoiceModalPopup } from "../voice/voice-modal-popup"
import { LanguageSelect } from "./agent-session-language"
import { ModelSelect } from "./agent-session-model"

const PROMPT_PLACEHOLDER =
  "Describe the agent's role, tone, rules, and conversation flow..."

export function AgentSessionPrimaryTab() {
  const [prompt, setPrompt] = React.useState("")

  const [voiceOpen, setVoiceOpen] = React.useState(false)

  return (
    <Card className="min-h-96 gap-0 py-0">
      <div className="flex min-h-full flex-col">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-3 text-xs">
          <Metric label="Agent Details" />
          <Metric label="Cost" value="$0.115/min" icon={WalletCardsIcon} />
          <Metric label="Latency" value="1620-2100ms" icon={GaugeIcon} />
          <Metric label="Tokens" value="816 - 3k" icon={SquareStackIcon} />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-4 py-3">

          <ModelSelect />

          <VoiceModalPopup open={voiceOpen} onOpenChange={open => setVoiceOpen(open)} />

          <LanguageSelect />

          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="outline" className="h-9">
              <BotIcon className="size-4 text-muted-foreground" />
              Agent Handbook
            </Button>

            <Button type="button" variant="outline" size="icon-lg">
              <Clock3Icon />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={PROMPT_PLACEHOLDER}
            className="min-h-[28rem] flex-1 resize-none border-muted-foreground/20 p-4 leading-6 shadow-none"
          />
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
