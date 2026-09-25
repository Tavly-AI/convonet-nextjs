"use server"

import OpenAI from "openai"
import type { CallRecordDatabaseData, LiveKitSessionReportPayload } from "./types"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function completeCallAnalysis(chatHistory: LiveKitSessionReportPayload["report"]["chat_history"]["items"],): Promise<Pick<NonNullable<CallRecordDatabaseData["call_analysis"]>, "call_summary" | "call_successful" | "user_sentiment">> {
    const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            {
                role: "system",
                content: `
Analyze this voice call.

Return:
- call_summary: A concise summary of what happened during the call.
- call_successful: Whether the call successfully achieved its apparent objective.
- user_sentiment: Exactly one of "Positive", "Negative", or "Neutral".

Only use information present in the conversation.
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
                    },
                    required: [
                        "call_summary",
                        "call_successful",
                        "user_sentiment",
                    ],
                    additionalProperties: false,
                },
            },
        },
    })

    const content = response.choices[0]?.message?.content
    if (!content) { throw new Error("Call analysis completion returned no content") }

    return JSON.parse(content) as Pick<NonNullable<CallRecordDatabaseData["call_analysis"]>, "call_summary" | "call_successful" | "user_sentiment">
}
