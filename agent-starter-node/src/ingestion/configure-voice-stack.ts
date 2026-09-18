import * as openai from "@livekit/agents-plugin-openai";
import * as anthropic from "@livekit/agents-plugin-anthropic";
import * as google from "@livekit/agents-plugin-google";

import * as deepgram from "@livekit/agents-plugin-deepgram";

import * as cartesia from "@livekit/agents-plugin-cartesia";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as sarvam from "@livekit/agents-plugin-sarvam";

import { VOICES_UPDATED, type Voice } from "../../../app/agents/_data/voices-updated.ts";
import type { RuntimeAgentConfig } from "./get-agent-config.ts";
import type { LlmProvider } from "../../../app/agents/_components/main/agent-session-model.tsx";

export function createVoiceStack(agentConfig: RuntimeAgentConfig) {

    // ============================================================
    // =========================== LLM ============================
    // ============================================================

    const model = agentConfig.llmConfig.model.trim() || "gpt-4.1";

    let llm;

    if (model.startsWith("gpt-")) {
        llm = new openai.responses.LLM({ model, maxOutputTokens: 512, strictToolSchema: false });
    } else if (model.startsWith("claude-")) {
        llm = new anthropic.LLM({ model });
    } else if (model.startsWith("gemini-")) {
        llm = new google.LLM({ model });
    } else {
        llm = openai.LLM.withGroq({ model: "openai/gpt-oss-120b" });
    }

    // ============================================================
    // =========================== STT ============================
    // ============================================================

    const languages = getProviderLanguages(agentConfig.config.language);

    const stt = new deepgram.STT({
        model: "nova-3",
        language: languages.deepgram,
    });

    // ============================================================
    // =========================== TTS ============================
    // ============================================================

    const voiceId = agentConfig.config.voiceId?.trim() || "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4";

    const voice = VOICES_UPDATED.find((voice) => voice.voice_id === voiceId);

    if (!voice) { throw new Error(`Voice not found: ${voiceId}`); }

    let tts;

    if (voice.provider === "cartesia") {
        tts = new cartesia.TTS({
            model: formatModelId(voice.model),
            voice: voice.voice_id,
            language: languages.cartesia,
        });
    } else if (voice.provider === "elevenlabs") {
        tts = new elevenlabs.TTS({
            modelID: voice.model,
            voiceId: voice.voice_id,
            language: languages.elevenlabs,
        });
    } else {
        tts = new sarvam.TTS({
            model: "bulbul:v3",
            speaker: "shubh",
            targetLanguageCode: "en-IN",
            sampleRate: 22050,
        });
    }

    return { llm, stt, tts };
}


// MISC CODE

/**
 * Converts a display-friendly model name into a provider-compatible model ID.
 *
 * Example:
 * "sonic 3.5" -> "sonic-3.5"
 * "sonic 3"   -> "sonic-3"
 */
function formatModelId(model: string): string {
    return model.trim().replace(/\s+/g, "-");
}


type SpeechLanguageProvider = Voice["provider"] | "deepgram" | "sarvam";;
type ProviderLanguages = Record<SpeechLanguageProvider | LlmProvider, string>;

export function getProviderLanguages(language: RuntimeAgentConfig["config"]["language"]): ProviderLanguages {

    const DEFAULT_AGENT_LANGUAGE = "en-US";

    const primaryLanguage = Array.isArray(language) ? language[0] : language;
    const locale = primaryLanguage?.trim().replaceAll("_", "-") || DEFAULT_AGENT_LANGUAGE;
    const speechLanguage = locale.split("-")[0]!.toLowerCase();

    return {
        gpt: locale,
        claude: locale,
        gemini: locale,
        deepgram: speechLanguage,
        elevenlabs: speechLanguage,
        cartesia: speechLanguage,
        sarvam: locale,
    };
}
