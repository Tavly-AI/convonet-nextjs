import { LLM_MODELS } from "../../../agents/_components/main/agent-session-model-server.tsx";
import type { VOICE_MODEL_MAP_MORE_SETTINGS } from "@/app/agents/_lib/session-storage/agent-session";

export const BILLING_GLOBAL_CONFIG_VALUES = {
    config: {
        currency: "usd",
        minimumRecharge: 10,
        callSurchargePenatly: 0.03
    },

    llmTokenSurcharge: {
        threshold: 3000,
        pricePerMinute: 0.01,
    },

    kb: {
        pricePerMinute: 0.005,
        freeKnowledgeBases: 10,
        pricePerAdditionalKnowledgeBasePerMonth: 8,
    },

    safetyGuardrails: {
        pricePerMinute: 0.005,
    },

    piiRemoval: {
        pricePerMinute: 0.01,
    },

    advancedDenoising: {
        pricePerMinute: 0.005,
    },

    batchCall: {
        pricePerDial: 0.005,
    },

    concurrency: {
        freeConcurrentCalls: 5,
        pricePerAdditionalConcurrentCallPerMonth: 8,
    },

    telephony: {
        twilio: {
            // Country rates: https://docs.retellai.com/deploy/international-call
            countryRates: {
                US: 0.015, CA: 0.03, IN: 0.15, AU: 0.10,
                DE: 0.10, ES: 0.10, GB: 0.10, MX: 0.05,
                FR: 0.06, JP: 0.28, IT: 0.06, ID: 0.40,
                PH: 0.80, MY: 0.20, TH: 0.45,
            },
            tollFreePricePerMinute: 0.06,
            // Platform fallback for destinations outside the country table.
            defaultPricePerMinute: 0.015,
        },
    },

    stt: {
        deepgram: {
            "nova-3": 0.0048,
        },
    },

    tts: {
        eleven_flash_v2: 0.03,
        eleven_flash_v2_5: 0.03,
        eleven_multilingual_v2: 0.06,
        eleven_v3: 0.06,
        eleven_v3_conversational: 0.06,
        eleven_v4: 0.06,
        eleven_v4_turbo: 0.06,
        "sonic-3": 0.03,
        "sonic-3-latest": 0.03,
        "sonic-3.5": 0.03,
        "sonic-3.6": 0.03,
    } satisfies Record<keyof typeof VOICE_MODEL_MAP_MORE_SETTINGS, number>,

    // USD per AI text message: https://www.retellai.com/pricing#pricing_breakdown
    chatLlm: {
        "gpt-5.6-terra": 0.0208,
        "gpt-5.5": 0.05,
        "gpt-5.4": 0.025,
        "gpt-4.1": 0.015,
        "claude-5-sonnet": 0.02,
        "gpt-5.2": 0.0175,
        "gpt-5.1": 0.0125,
        "gpt-5": 0.0125,
        "claude-4.6-sonnet": 0.03,
        "claude-4.5-sonnet": 0.03,
        "claude-4.5-haiku": 0.007,
        "gemini-3.6-flash": 0.0075,
        "gemini-3.5-flash": 0.015,
        "gemini-3.0-flash": 0.005,
        "gpt-5.6-luna": 0.002,
        "gpt-5.4-mini": 0.0075,
        "gpt-5.4-nano": 0.002,
        "gpt-5-mini": 0.0025,
        "gpt-5-nano": 0.0005,
        "gpt-4.1-mini": 0.004,
        "gpt-4.1-nano": 0.001,
        "gemini-3.1-flash-lite": 0.0025,
        "gemini-3.5-flash-lite": 0.003,
    } satisfies Record<(typeof LLM_MODELS)[number][0], number>,

    llm: Object.fromEntries(
        LLM_MODELS.map(([id, , , price]) => [id, Number(price.replace("$", "").replace("/min", ""))])
    ) as Record<(typeof LLM_MODELS)[number][0], number>,
} as const
