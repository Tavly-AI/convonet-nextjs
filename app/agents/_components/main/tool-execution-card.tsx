import { BookOpenIcon, WrenchIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toolOutputReportsError, type ToolExecutionEvent } from "@/lib/livekit-tool-events"

function formatToolValue(value: string) {
    try { return JSON.stringify(JSON.parse(value), null, 2) }
    catch { return value }
}

export function ToolExecutionCard({ event }: { event: ToolExecutionEvent }) {
    const isKnowledgeBase = event.name === "search_knowledge_base"
    const Icon = isKnowledgeBase ? BookOpenIcon : WrenchIcon
    const isError = event.is_error || toolOutputReportsError(event.output)
    return (
        <details className="min-w-0 rounded-lg border border-dashed bg-muted/30">
            <summary className="cursor-pointer p-3 text-sm marker:text-muted-foreground">
                <span className="ml-1 inline-flex max-w-full flex-wrap items-center gap-2 align-middle">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="break-all font-medium">{isKnowledgeBase ? "Knowledge base search" : event.name}</span>
                    <Badge variant={isError ? "destructive" : "outline"}>{isError ? "Error" : "Completed"}</Badge>
                </span>
            </summary>
            <div className="space-y-3 border-t p-3 text-sm">
                <div className="break-all text-xs text-muted-foreground">{event.name} · {event.call_id}</div>
                {([["Arguments", event.arguments], ["Output", event.output]] as const).map(([label, value]) => (
                    <div key={label} className="space-y-1">
                        <p className="font-medium">{label}</p>
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs">{formatToolValue(value) || "(empty)"}</pre>
                    </div>
                ))}
            </div>
        </details>
    )
}
