"use server"

import OpenAI from "openai"
import type { PostCallAnalysisSettings } from "@/app/agents/_lib/session-storage/agent-session"
import type { CallRecordDatabaseData, LiveKitSessionReportPayload } from "./types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

type PostCallExtractionFields = PostCallAnalysisSettings["post_call_analysis_data"]
type CallAnalysis = Pick<NonNullable<CallRecordDatabaseData["call_analysis"]>, "call_summary" | "call_successful" | "user_sentiment"> & {
    custom_analysis_data: Record<string, unknown>
}

export async function completeCallAnalysis(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"], fields: PostCallExtractionFields, model: string,): Promise<CallAnalysis> {

    const customFields = fields.filter((field) => field.type !== "system-presets" && field.name && field.description)
    const response = await openai.chat.completions.create({
        model,
        messages: [
            {
                role: "system",
                content: `
Analyze this voice call.

Return:
- call_summary: A concise summary of what happened during the call.
- call_successful: Whether the call successfully achieved its apparent objective.
- user_sentiment: Exactly one of "Positive", "Negative", or "Neutral".
- custom_analysis_data: Extract the configured fields below. Use null when a value was not stated or cannot be determined.

Only use information present in the conversation.
Configured fields:
${customFields.map((field) => `- ${field.name}: ${field.description}${field.conditional_prompt ? ` ${field.conditional_prompt}` : ""}`).join("\n")}
        `.trim(),
            },
            {
                role: "user",
                content: JSON.stringify(chatHistory),
            },
        ],

        response_format: {
            type: "json_schema",
            json_schema: {
                name: "call_analysis",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        call_summary: {
                            type: "string",
                        },
                        call_successful: {
                            type: "boolean",
                        },
                        user_sentiment: {
                            type: "string",
                            enum: ["Positive", "Negative", "Neutral"],
                        },
                        custom_analysis_data: {
                            type: "object",
                            properties: Object.fromEntries(customFields.map((field) => [field.name, getFieldSchema(field)])),
                            required: customFields.map((field) => field.name),
                            additionalProperties: false,
                        },
                    },
                    required: [
                        "call_summary",
                        "call_successful",
                        "user_sentiment",
                        "custom_analysis_data",
                    ],
                    additionalProperties: false,
                },
            },
        },
    })

    const content = response.choices[0]?.message?.content
    if (!content) { throw new Error("Call analysis completion returned no content") }

    return JSON.parse(content) as CallAnalysis
}

function getFieldSchema(field: PostCallExtractionFields[number]) {
    if (field.type === "enum") return { type: ["string", "null"], enum: [...(field.choices ?? []), null] }
    if (field.type === "number") return { type: ["number", "null"] }
    if (field.type === "boolean") return { type: ["boolean", "null"] }
    return { type: ["string", "null"] }
}
