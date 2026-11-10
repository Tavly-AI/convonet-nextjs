import { SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS } from "@/app/dashboard/batch-call/_lib/batch-call-inngest-constants"
import { Inngest } from "inngest"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"
import { redactAudioWithAssemblyAI } from "./scrubbed_post-session-assembly-ai-pipieline"

export const scrubbedPostSessionTranscriptWithToolCallsInngestClient = new Inngest({
    id: SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.app.clientId,
})

export const scrubbedPostSessionTranscriptWithToolCallsInngestProcess = scrubbedPostSessionTranscriptWithToolCallsInngestClient.createFunction(
    {
        id: SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.functions.process,
        retries: 3,
        triggers: [{ event: SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.events.created }],
    },
    async ({ event, step }) => {

        // ===============================================================
        // =================== GET DATA FROM PARAMS ======================
        // ===============================================================

        const { callId } = event.data

        const { agentId, transcriptWithToolCalls, recordingUrl } = await step.run(
            SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.steps.process.getCall,
            async () => {
                const call = await prisma.callRecord.findUniqueOrThrow({
                    where: { call_id: callId },
                    select: {
                        agent_id: true,
                        transcript_with_tool_calls: true,
                        recording_url: true,
                        recording_multi_channel_url: true,
                    },
                })

                return {
                    agentId: call.agent_id,
                    transcriptWithToolCalls: call.transcript_with_tool_calls,
                    recordingUrl: call.recording_multi_channel_url ?? call.recording_url,
                }
            },
        )


        // ===============================================================
        // ============== RESOLVE SCRUBBED TRANSCRIPTION =================
        // ===============================================================

        if (transcriptWithToolCalls === null) return { success: false, callId, reason: "No transcript" }
        if (!Array.isArray(transcriptWithToolCalls)) throw new Error("Expected a transcript event array")
        if (!recordingUrl) throw new Error("Call recording URL is missing")

        const { assembly_ai_raw_replacements, assembly_ai_raw_redactedAudioUrl } = await step.run(SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.steps.process.redactAudio, async () => {
            return redactAudioWithAssemblyAI("https://basicenglishspeaking.com/wp-content/uploads/audio/QA/QA-19.mp3")
        })

        // ===============================================================
        // ============== SAVE SCRUBBED STUFF INSIDE DB ==================
        // ===============================================================

        await step.run(SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS.steps.process.saveScrubbedTranscript, async () => {
            const scrubbed = scrubTranscript(transcriptWithToolCalls, assembly_ai_raw_replacements)
            await prisma.callRecord.update({
                where: { call_id: callId },
                data: {
                    scrubbed_post_session_transcript_with_tool_calls: scrubbed,
                    scrubbed_recording_url: assembly_ai_raw_redactedAudioUrl,
                },
            })
        })

        return { success: true, callId, agentId, assembly_ai_raw_redactedAudioUrl }
    }
)

// MISC CODE

function scrubTranscript(events: Prisma.JsonArray, replacements: Record<string, string>): Prisma.InputJsonArray {
    const phrases = Object.keys(replacements).filter(Boolean).sort((a, b) => b.length - a.length)
    const pattern = phrases.length ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${phrases.map(phrase => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}_])`, "gu") : null
    const redact = (text: string) => pattern ? text.replace(pattern, match => replacements[match]) : text

    function redactValue(value: Prisma.JsonValue): Prisma.JsonValue {
        if (typeof value === "string") return redact(value)
        if (typeof value === "number" && Object.hasOwn(replacements, String(value))) return replacements[String(value)]
        if (Array.isArray(value)) return value.map(redactValue)
        if (value && typeof value === "object") { return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, item === undefined ? null : redactValue(item)])) }
        return value
    }

    function redactPayload(text: string): string {
        let value: Prisma.JsonValue
        try { value = JSON.parse(text) as Prisma.JsonValue } catch { return redact(text) }
        return JSON.stringify(redactValue(value))
    }

    return events.map(event => {
        if (!event || typeof event !== "object" || Array.isArray(event)) throw new Error("Invalid transcript event")
        if (event.type === "message" && typeof event.content === "string") { return { ...event, content: redact(event.content) } }
        if (event.type === "function_call" && typeof event.arguments === "string") { return { ...event, arguments: redactPayload(event.arguments) } }
        if (event.type === "function_call_output" && typeof event.output === "string") { return { ...event, output: redactPayload(event.output) } }
        throw new Error("Unsupported or malformed transcript event")
    })
}
