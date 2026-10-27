export const TOOL_EVENTS_TOPIC = "agent.tool-events"
export const MAX_TOOL_EVENT_BYTES = 12 * 1024

export type ToolExecutionEvent = {
    type: "tool_executed"
    call_id: string
    name: string
    arguments: string
    output: string
    is_error: boolean
    timestamp: number
}

export function toolOutputReportsError(output: string): boolean {
    try {
        const parsed: unknown = JSON.parse(output)
        return !!parsed && typeof parsed === "object" && "status" in parsed && parsed.status === "error"
    } catch {
        return false
    }
}

export function encodeToolExecutionEvent(event: ToolExecutionEvent): Uint8Array {
    const bounded = { ...event, is_error: event.is_error || toolOutputReportsError(event.output) }
    const encoder = new TextEncoder()
    const marker = "\n… [truncated]"
    let payload = encoder.encode(JSON.stringify(bounded))
    while (payload.byteLength > MAX_TOOL_EVENT_BYTES) {
        const key = bounded.arguments.length > bounded.output.length ? "arguments" : "output"
        if (bounded[key].length <= marker.length) throw new Error("Tool event metadata exceeds packet limit")
        const content = bounded[key].endsWith(marker) ? bounded[key].slice(0, -marker.length) : bounded[key]
        bounded[key] = content.slice(0, Math.floor(content.length / 2)) + marker
        payload = encoder.encode(JSON.stringify(bounded))
    }
    return payload
}

export function decodeToolExecutionEvent(payload: Uint8Array): ToolExecutionEvent | null {
    if (payload.byteLength > MAX_TOOL_EVENT_BYTES) return null
    try {
        const event: unknown = JSON.parse(new TextDecoder().decode(payload))
        if (!event || typeof event !== "object") return null
        const value = event as Record<string, unknown>
        if (value.type !== "tool_executed" ||
            typeof value.call_id !== "string" || !value.call_id ||
            typeof value.name !== "string" || !value.name ||
            typeof value.arguments !== "string" || typeof value.output !== "string" ||
            typeof value.is_error !== "boolean" ||
            typeof value.timestamp !== "number" || !Number.isFinite(value.timestamp)) return null
        return value as ToolExecutionEvent
    } catch {
        return null
    }
}
