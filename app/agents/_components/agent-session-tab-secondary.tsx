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

import { Card } from "@/components/ui/card"

const SETTINGS = [
  { label: "Functions", icon: BlocksIcon },
  { label: "Knowledge Base", icon: BookOpenIcon },
  { label: "Speech Settings", icon: SpeechIcon },
  { label: "Realtime Transcription Settings", icon: LanguagesIcon },
  { label: "Call Settings", icon: HeadphonesIcon },
  { label: "Post-Call Data Extraction", icon: ChartNoAxesCombinedIcon },
  { label: "Security & Fallback Settings", icon: ShieldCheckIcon },
  { label: "Webhook Settings", icon: WebhookIcon },
  { label: "MCPs", icon: PaperclipIcon },
]

export function AgentSessionTabSecondary() {
  return (
    <Card className="min-h-96 gap-0 py-0">
      <div className="divide-y px-4">
        {SETTINGS.map(({ label, icon: Icon }) => (
          <div key={label} className="flex min-h-16 items-center gap-3 px-1 py-4">
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{label}</span>
            <ChevronDownIcon className="ml-auto size-4 shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  )
}
