import type { CallRecord, Prisma } from "@/generated/prisma/client"

type CallRecordCallType = "inbound" | "outbound" | "webrtc"
type CallRecordDirection = "inbound" | "outbound"
type CallRecordStatus = "registered" | "not_connected" | "ongoing" | "ended" | "error"

type CallRecordDisconnectionReason =
    | "user_hangup" | "agent_hangup" | "call_transfer" | "voicemail_reached" | "ivr_reached" | "inactivity"
    | "max_duration_reached" | "concurrency_limit_reached" | "no_concurrency_fallback" | "no_valid_payment"
    | "scam_detected" | "dial_busy" | "dial_failed" | "dial_no_answer" | "invalid_destination"
    | "telephony_provider_permission_denied" | "telephony_provider_unavailable" | "sip_routing_error"
    | "marked_as_spam" | "user_declined" | "error_llm_websocket_open" | "error_llm_websocket_lost_connection"
    | "error_llm_websocket_runtime" | "error_llm_websocket_corrupt_payload" | "error_no_audio_received" | "error_asr"
    | "error_retell" | "error_unknown" | "error_user_not_joined" | "registered_call_timeout"
    | "transfer_bridged" | "transfer_cancelled" | "manual_stopped" | "call_take_over"

type CallRecordJson = Prisma.JsonValue

type CallRecordTranscriptItem = {
    role: "user" | "assistant" | "system"
    content: string
    start_timestamp: number
    end_timestamp: number
}

type CallRecordAnalysis = {
    call_summary: string
    call_successful: boolean
    user_sentiment: "Positive" | "Negative" | "Neutral"
    in_voicemail: boolean
    custom_analysis_data: Record<string, CallRecordJson>
}

type CallRecordLatencyStats = {
    p50: number
    p90: number
    p95: number
    p99: number
    max: number
    min: number
    num: number
    values: number[]
}

type CallRecordLatency = Record<"e2e" | "asr" | "llm" | "llm_websocket_network_rtt" | "tts" | "knowledge_base" | "s2s", CallRecordLatencyStats>

type CallRecordCost = {
    product_costs: Array<{ product: string; cost: number; unit_price: number; is_transfer_leg_cost: boolean }>
    total_duration_seconds: number
    total_duration_unit_price: number
    combined_cost: number
}

type CallRecordLlmTokenUsage = { values: number[]; average: number; num_requests: number }

/** Prisma's generated CallRecord model with JSON columns narrowed for this app's readers. */
export type CallRecordDatabaseData = Omit<
    CallRecord,
    "call_type" | "direction" | "call_status" | "disconnection_reason" | "transcript_object" | "latency" | "call_analysis" | "call_cost" | "llm_token_usage"
> & {
    call_type: CallRecordCallType | null
    direction: CallRecordDirection | null
    call_status: CallRecordStatus
    disconnection_reason: CallRecordDisconnectionReason | null
    transcript_object: CallRecordTranscriptItem[] | null
    latency: CallRecordLatency | null
    call_analysis: CallRecordAnalysis | null
    call_cost: CallRecordCost | null
    llm_token_usage: CallRecordLlmTokenUsage | null
}

type LiveKitChatItem = {
    type: string
    created_at: number
    role?: "user" | "assistant" | "system"
    content?: unknown[]
    metrics?: {
        transcription_delay?: unknown
        llm_node_ttft?: unknown
        tts_node_ttfb?: unknown
        e2e_latency?: unknown
        started_speaking_at?: number
        stopped_speaking_at?: number
        [key: string]: unknown
    }
    [key: string]: unknown
}

type LiveKitReportUsage = { type: string;[key: string]: unknown }

/** The subset of the snake_case LiveKit session-report JSON consumed by this API. */
export type LiveKitSessionReportPayload = {
    agentId: CallRecordDatabaseData["agent_id"]
    callType: CallRecordDatabaseData["call_type"]
    fromNumber: CallRecordDatabaseData["from_number"]
    toNumber: CallRecordDatabaseData["to_number"]
    report: {
        job_id: string
        room: string
        chat_history: { items: LiveKitChatItem[] }
        usage?: LiveKitReportUsage[] | null
    }
}
