"use server"

import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import { GoogleGenAI } from "@google/genai"
import { LLM_MODELS, type LlmModel } from "@/app/agents/_components/main/agent-session-model-server"

const openai = new OpenAI()
const anthropic = new Anthropic()
const google = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function countTokensUsedByCurrentAgent(model: LlmModel, sections: Record<string, string>) {

    async function count(text: string): Promise<number> {
        if (!text.trim()) return 0

        if (!LLM_MODELS.some(([id]) => id === model)) {
            throw new Error(`Unsupported model: ${model}`)
        }

        if (model.startsWith("claude")) {
            const result = await anthropic.messages.countTokens({ model, messages: [{ role: "user", content: text }] })
            return result.input_tokens
        }

        if (model.startsWith("gemini")) {
            const result = await google.models.countTokens({ model, contents: text })
            return result.totalTokens ?? 0
        }

        if (model.startsWith("gpt")) {
            const result = await openai.responses.inputTokens.count({ model, input: text })
            return result.input_tokens
        }

        throw new Error(`Unsupported model: ${model}`)
    }

    const breakdown = await Promise.all(
        Object.entries(sections).map(async ([label, text]) => ({
            label,
            count: await count(text),
        }))
    )

    return {
        total: breakdown.reduce((sum, item) => sum + item.count, 0),
        breakdown,
    }
}