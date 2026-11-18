import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import type { CallRecord } from "@/generated/prisma/client"
import type { AnalyticsGlobalTypes } from "./analytics-globla-types"

type Option = { value: string; label: string }
type JsonPaths<T> = { [K in keyof T & string]: NonNullable<T[K]> extends string | number | boolean ? K : never }[keyof T & string]
type FilterField = keyof CallRecord | `call_analysis.${JsonPaths<NonNullable<CallRecordDatabaseData["call_analysis"]>>}` | `latency.e2e.${JsonPaths<NonNullable<CallRecordDatabaseData["latency"]>["e2e"]>}` | `call_cost.${JsonPaths<NonNullable<CallRecordDatabaseData["call_cost"]>>}`
type Field = { value: FilterField; label: string; kind: "text" | "number" | "enum" | "boolean"; options?: Option[] }
const options = (values: readonly string[]): Option[] => values.map(value => ({ value, label: value.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) }))

const statuses = ["registered", "not_connected", "ongoing", "ended", "error"] satisfies CallRecordDatabaseData["call_status"][]
const callTypes = ["inbound", "outbound", "webrtc"] satisfies NonNullable<CallRecordDatabaseData["call_type"]>[]
const reasons = [
    "user_hangup", "agent_hangup", "call_transfer", "voicemail_reached", "ivr_reached", "inactivity",
    "max_duration_reached", "concurrency_limit_reached", "no_concurrency_fallback", "no_valid_payment",
    "scam_detected", "dial_busy", "dial_failed", "dial_no_answer", "invalid_destination",
    "telephony_provider_permission_denied", "telephony_provider_unavailable", "sip_routing_error",
    "marked_as_spam", "user_declined", "error_llm_websocket_open", "error_llm_websocket_lost_connection",
    "error_llm_websocket_runtime", "error_llm_websocket_corrupt_payload", "error_no_audio_received", "error_asr",
    "error_retell", "error_unknown", "error_user_not_joined", "registered_call_timeout",
    "transfer_bridged", "transfer_cancelled", "manual_stopped", "call_take_over",
] satisfies NonNullable<CallRecordDatabaseData["disconnection_reason"]>[]

const FILTER_FIELDS: Field[] = [
    { value: "agent_id", label: "Agent ID", kind: "text" },
    { value: "call_id", label: "Call ID", kind: "text" },
    { value: "batchCallId", label: "Batch call ID", kind: "text" },
    { value: "call_type", label: "Call type", kind: "enum", options: options(callTypes) },
    { value: "duration_ms", label: "Duration (ms)", kind: "number" },
    { value: "from_number", label: "From number", kind: "text" },
    { value: "to_number", label: "To number", kind: "text" },
    { value: "call_analysis.user_sentiment", label: "User sentiment", kind: "enum", options: options(["Positive", "Neutral", "Negative"]) },
    { value: "disconnection_reason", label: "Disconnection reason", kind: "enum", options: options(reasons) },
    { value: "call_status", label: "Call status", kind: "enum", options: options(statuses) },
    { value: "call_analysis.call_successful", label: "Call successful", kind: "boolean", options: [{ value: "true", label: "Successful" }, { value: "false", label: "Unsuccessful" }] },
    { value: "latency.e2e.p99", label: "E2E p99 latency (ms)", kind: "number" },
    { value: "call_cost.combined_cost", label: "Combined cost (stored units)", kind: "number" },
]


function filterOperators(fieldKey: string): Option[] {
    const kind = FILTER_FIELDS.find(field => field.value === fieldKey)?.kind
    return [
        { value: "eq", label: "Equals" }, { value: "neq", label: "Does not equal" },
        ...(kind === "text" ? [{ value: "contains", label: "Contains" }] : []),
        ...(kind === "number" ? [{ value: "gt", label: "Greater than" }, { value: "lt", label: "Less than" }] : []),
    ]
}

function analytics_check_if_analytics_filter(value: unknown): value is AnalyticsGlobalTypes["AnalyticsFilterType"] {
    if (!value || typeof value !== "object") return false
    const row = value as Partial<AnalyticsGlobalTypes["AnalyticsFilterType"]>
    const field = FILTER_FIELDS.find(field => field.value === row.field)
    if (!field || !filterOperators(field.value).some(operator => operator.value === row.operator)) return false
    if (field.kind === "number") return typeof row.value === "number" && Number.isFinite(row.value) && row.value >= 0
    if (field.kind === "boolean") return typeof row.value === "boolean"
    if (field.kind === "enum") return !!field.options?.some(option => option.value === row.value)
    return typeof row.value === "string" && row.value.trim().length > 0
}

function analytics_read_Analytics_Filters(raw: string | null): AnalyticsGlobalTypes["AnalyticsFilterType"][] {
    try {
        const parsed: unknown = JSON.parse(raw ?? "[]")
        return Array.isArray(parsed) ? parsed.filter(analytics_check_if_analytics_filter) : []
    } catch { return [] }
}

function writeAnalyticsFilters(current: string, filters: AnalyticsGlobalTypes["AnalyticsFilterType"][]): URLSearchParams {
    const params = new URLSearchParams(current)
    if (filters.length) params.set("filters", JSON.stringify(filters))
    else params.delete("filters")
    params.delete("breakdowns")
    return params
}

export const analytics_filter_modal_filter_params = {
    fields: FILTER_FIELDS,
    operators: filterOperators,
    isValid: analytics_check_if_analytics_filter,
    read: analytics_read_Analytics_Filters,
    write: writeAnalyticsFilters,
}
