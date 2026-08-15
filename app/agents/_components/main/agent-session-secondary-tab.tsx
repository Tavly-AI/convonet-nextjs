"use client"

import * as React from "react"
import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BlocksIcon,
  BookOpenIcon,
  ChartNoAxesCombinedIcon,
  ChevronDownIcon,
  HeadphonesIcon,
  LanguagesIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  SpeechIcon,
  WebhookIcon,
} from "lucide-react"

import { GeneralToolsEditor } from "@/app/agents/_components/functions/general-tools-editor"
import { McpTools } from "@/app/agents/_components/mcp/mcp-tools"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SecondaryTab = {
  id: string
  label: string
  icon: LucideIcon
  content?: ComponentType
}

const SECONDARY_TABS = [
  {
    id: "functions",
    label: "Functions",
    icon: BlocksIcon,
    content: GeneralToolsEditor,
  },
  { id: "knowledge-base", label: "Knowledge Base", icon: BookOpenIcon },
  { id: "speech", label: "Speech Settings", icon: SpeechIcon },
  {
    id: "transcription",
    label: "Realtime Transcription Settings",
    icon: LanguagesIcon,
  },
  { id: "call", label: "Call Settings", icon: HeadphonesIcon },
  {
    id: "post-call",
    label: "Post-Call Data Extraction",
    icon: ChartNoAxesCombinedIcon,
  },
  {
    id: "security",
    label: "Security & Fallback Settings",
    icon: ShieldCheckIcon,
  },
  { id: "webhook", label: "Webhook Settings", icon: WebhookIcon },
  { id: "mcps", label: "MCPs", icon: PaperclipIcon, content: McpTools },
] as const satisfies readonly SecondaryTab[]

type SecondaryTabId = (typeof SECONDARY_TABS)[number]["id"]

export function AgentSessionTabSecondary() {
  const [openTab, setOpenTab] = React.useState<SecondaryTabId | null>(null)

  return (
    <Card className="min-h-96 gap-0 py-0">
      <div className="divide-y px-4">
        {SECONDARY_TABS.map((tab) => {
          const { id, label, icon: Icon } = tab
          const Content = "content" in tab ? tab.content : null
          const open = openTab === id

          return (
            <div key={id}>
              <button
                type="button"
                className="flex min-h-16 w-full items-center gap-3 px-1 py-4 text-left"
                aria-expanded={Content ? open : undefined}
                onClick={() => Content && setOpenTab(open ? null : id)}
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{label}</span>
                <ChevronDownIcon
                  className={cn(
                    "ml-auto size-4 shrink-0 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>
              {open && Content && <Content />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
