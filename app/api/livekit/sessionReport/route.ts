import { NextResponse } from "next/server"
import { completeCallAnalysis } from "./complete-call-analysis"

import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { CallRecordDatabaseData, LiveKitSessionReportPayload } from "./types"
import { calculateLatencyStats, checkIsSessionReportPayload } from "./helper-functions"
import type { PostCallAnalysisSettings } from "@/app/agents/_lib/session-storage/agent-session"

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    if (!checkIsSessionReportPayload(body)) { return NextResponse.json({ error: "Invalid LiveKit session report" }, { status: 400 }) }

    const agent = await prisma.agent.findUnique({
      where: { id: body.agentId },
      select: { workspaceId: true, config: true },
    })
    if (!agent) { return NextResponse.json({ error: "Agent not found" }, { status: 404 }) }

    const chatHistory = body.report.chat_history.items
    const data = {
      workspaceId: agent.workspaceId,
      call_id: body.report.room,
      ...deriveDirectData(body),
      ...deriveTranscript(chatHistory),
      ...deriveHardcodedFields(),
      ...deriveCallTiming(chatHistory),
      ...deriveRecording(body.report),
      latency: deriveLatency(chatHistory),
      llm_token_usage: deriveLlmTokenUsage(body.report.usage),
      call_analysis: await deriveCallAnalysis(chatHistory, agent.config as PostCallAnalysisSettings),
    } as Prisma.CallRecordUncheckedCreateInput

    await prisma.callRecord.upsert({
      where: { call_id: data.call_id },
      create: data,
      update: data,
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to persist LiveKit session report" }, { status: 500 })
  }
}

//derive

function deriveDirectData(body: LiveKitSessionReportPayload,): Pick<CallRecordDatabaseData, "agent_id" | "agent_version" | "call_type" | "direction" | "from_number" | "to_number"> {
  return {
    agent_id: body.agentId,
    agent_version: null,
    call_type: body.callType,
    direction: body.callType === "inbound" ? "inbound" : body.callType === "outbound" ? "outbound" : null,
    from_number: body.fromNumber,
    to_number: body.toNumber,
  }
}


function deriveTranscript(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"]): Pick<CallRecordDatabaseData, "transcript" | "transcript_object" | "transcript_with_tool_calls"> {

  const messages = chatHistory.flatMap((item) => {
    if (item.type !== "message" || !Array.isArray(item.content) || typeof item.role !== "string") return []
    return [{ role: item.role, content: item.content.filter((x): x is string => typeof x === "string").join(" ") }]
  })

  const messagesWithTimestamp = chatHistory.flatMap((item) => {
    if (item.type !== "message" || !Array.isArray(item.content) || typeof item.role !== "string") return []

    return [{
      role: item.role,
      content: item.content.filter((x): x is string => typeof x === "string").join(" "),
      start_timestamp: item.metrics?.started_speaking_at ? Math.round(item.metrics.started_speaking_at * 1000) : Math.round(item.created_at * 1000),
      end_timestamp: item.metrics?.stopped_speaking_at ? Math.round(item.metrics.stopped_speaking_at * 1000) : Math.round(item.created_at * 1000),
    }]
  })

  return {
    transcript: messages.map(({ role, content }) => `${role}: ${content}`).join("\n"),
    transcript_object: messagesWithTimestamp,
    transcript_with_tool_calls: null,
  }
}



function deriveLlmTokenUsage(usage: LiveKitSessionReportPayload["report"]["usage"]) {
  const values = (usage ?? []).flatMap((usage) => {
    if (
      usage.type !== "llm_usage" ||
      !("input_tokens" in usage) || typeof usage.input_tokens !== "number" ||
      !("output_tokens" in usage) || typeof usage.output_tokens !== "number"
    ) return []
    return [usage.input_tokens + usage.output_tokens]
  })

  const num_requests = values.length
  const average = num_requests > 0 ? values.reduce((sum, value) => sum + value, 0) / num_requests : 0

  return { values, average, num_requests }
}

async function deriveCallAnalysis(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"], config: PostCallAnalysisSettings) {
  const analysis = await completeCallAnalysis(chatHistory, config.post_call_analysis_data, config.post_call_analysis_model)

  return {
    call_summary: analysis.call_summary,
    in_voicemail: false,
    user_sentiment: analysis.user_sentiment,
    call_successful: analysis.call_successful,
    custom_analysis_data: analysis.custom_analysis_data,
  }
}

function deriveHardcodedFields(): Pick<CallRecordDatabaseData, "transfer_destination" | "call_cost" | "knowledge_base_retrieved_contents_url" | "public_log_url" | "transfer_end_timestamp" | "data_storage_setting" | "opt_in_signed_url" | "custom_sip_headers" | "retell_llm_dynamic_variables" | "metadata"> {
  return {
    transfer_destination: null,

    call_cost: {
      product_costs: [],
      total_duration_seconds: 0,
      total_duration_unit_price: 0,
      combined_cost: 0,
    },

    knowledge_base_retrieved_contents_url: null,
    public_log_url: null,
    transfer_end_timestamp: null,
    data_storage_setting: null,
    opt_in_signed_url: null,
    custom_sip_headers: null,
    retell_llm_dynamic_variables: null,
    metadata: null
  }
}

function deriveLatency(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"]) {
  const e2eValues: number[] = []
  const asrValues: number[] = []
  const llmValues: number[] = []
  const ttsValues: number[] = []

  for (const item of chatHistory) {
    if (item.type !== "message" || !("metrics" in item) || !item.metrics || typeof item.metrics !== "object") continue
    const metrics = item.metrics

    if ("e2e_latency" in metrics && typeof metrics.e2e_latency === "number") { e2eValues.push(Math.round(metrics.e2e_latency * 1000),) }
    if ("transcription_delay" in metrics && typeof metrics.transcription_delay === "number") { asrValues.push(Math.round(metrics.transcription_delay * 1000),) }
    if ("llm_node_ttft" in metrics && typeof metrics.llm_node_ttft === "number") { llmValues.push(Math.round(metrics.llm_node_ttft * 1000),) }
    if ("tts_node_ttfb" in metrics && typeof metrics.tts_node_ttfb === "number") { ttsValues.push(Math.round(metrics.tts_node_ttfb * 1000),) }
  }

  return {
    e2e: calculateLatencyStats(e2eValues),
    asr: calculateLatencyStats(asrValues),
    llm: calculateLatencyStats(llmValues),
    tts: calculateLatencyStats(ttsValues),

    // Not available in report
    llm_websocket_network_rtt: calculateLatencyStats([]),
    knowledge_base: calculateLatencyStats([]),
    s2s: calculateLatencyStats([]),
  }
}

function deriveCallTiming(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"],): Pick<CallRecordDatabaseData, "start_timestamp" | "end_timestamp" | "duration_ms"> {
  const timestamps = chatHistory.map((item) => Math.round(item.created_at * 1000))
  if (!timestamps.length) { return { start_timestamp: null, end_timestamp: null, duration_ms: null } }

  const start = Math.min(...timestamps)
  const end = Math.max(...timestamps)

  return {
    start_timestamp: BigInt(start),
    end_timestamp: BigInt(end),
    duration_ms: end - start,
  }
}

function deriveRecording(report: LiveKitSessionReportPayload["report"],): Pick<CallRecordDatabaseData, | "recording_url" | "recording_multi_channel_url"> {
  const bucket = process.env.CONVONENT_AWS_BUCKET
  const region = process.env.AWS_REGION
  const prefix = process.env.EGRESS_RECORDINGS_S3_BUCKET_PREFIX?.replace(/^\/+|\/+$/g, "",)

  if (!bucket || !region || !prefix) { return { recording_url: null, recording_multi_channel_url: null, } }

  const objectKey = `${prefix}/${report.job_id}.ogg`

  const recordingUrl = `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`

  return {
    recording_url: null,
    recording_multi_channel_url: recordingUrl,

  }
}

// function deriveVoidFields(){
//   call_status: void,
//   disconnection_reason: void
// }
