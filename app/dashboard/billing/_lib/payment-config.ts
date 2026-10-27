import { LLM_MODELS } from "@/app/agents/_components/main/agent-session-model-server";

export const BILLING_GLOBAL_CONFIG_VALUES = {
    config: {
        currency: "usd",
        pricePerMinute: 0.08,
        minimumRecharge: 10,
    },

    stt: {
        deepgram: {
            "flux": 0.0065,
            "flux-multilingual": 0.0078,
            "nova-3": 0.0048,
            "nova-3-multilingual": 0.0058,
        },
    },

    tts: {
        cartesia: {
            "sonic 3.5": 0.0300,
            "sonic 3": 0.0300,
        },
        elevenlabs: {
            "eleven_flash_v2_5": 0.0300,
        },
    },

    llm: Object.fromEntries(
        LLM_MODELS.map(([id, , , price]) => [id, Number(price.replace("$", "").replace("/min", ""))])
    ) as Record<(typeof LLM_MODELS)[number][0], number>,
} as const
