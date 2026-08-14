import type { ComponentType } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BlocksIcon,
  BookOpenIcon,
  ChartNoAxesCombinedIcon,
  HeadphonesIcon,
  LanguagesIcon,
  PaperclipIcon,
  ShieldCheckIcon,
  SpeechIcon,
  WebhookIcon,
} from "lucide-react"

import { GeneralToolsEditor } from "@/app/agents/_components/functions/general-tools-editor"

export type SecondaryTab = {
  id: string
  label: string
  icon: LucideIcon
  content?: ComponentType
}

export const SECONDARY_TABS = [
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
  { id: "mcps", label: "MCPs", icon: PaperclipIcon },
] as const satisfies readonly SecondaryTab[]

export type SecondaryTabId = (typeof SECONDARY_TABS)[number]["id"]
