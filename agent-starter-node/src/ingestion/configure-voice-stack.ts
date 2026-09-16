import * as openai from "@livekit/agents-plugin-openai";
import * as anthropic from "@livekit/agents-plugin-anthropic";
import * as google from "@livekit/agents-plugin-google";

import * as deepgram from "@livekit/agents-plugin-deepgram";

import * as cartesia from "@livekit/agents-plugin-cartesia";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as sarvam from "@livekit/agents-plugin-sarvam";

import type { LlmModel } from "../../../app/agents/_components/main/agent-session-model.tsx";
import { VOICES_UPDATED } from "../../../app/agents/_data/voices-updated.ts";

// export function createVoiceStack(agentConfig: RuntimeAgentConfig) {
export function createVoiceStack() {

    // const { config, llmConfig } = agentConfig;

    const model: LlmModel = "gpt-4.1";
    const voiceId = "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4";

    // ============================================================
    // =========================== LLM ============================
    // ============================================================

    let llm;

    if (model.startsWith("gpt-")) {
        // Booking calls include multiple required arguments. Reserve enough output
        // tokens for the function call and the follow-up voice response.
        llm = new openai.responses.LLM({
            model,
            maxOutputTokens: 512,
            // Keep runtime validation in our tools. Strict decoding can exhaust the
            // response budget for the booking tool's multi-field input schema.
            strictToolSchema: false,
        });
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

    const stt = new deepgram.STT({
        model: "nova-3",
        language: "en",
    });

    // ============================================================
    // =========================== TTS ============================
    // ============================================================

    const voice = VOICES_UPDATED.find((voice) => voice.voice_id === voiceId);

    if (!voice) { throw new Error(`Voice not found: ${voiceId}`); }

    let tts;

    if (voice.provider === "cartesia") {
        tts = new cartesia.TTS({
            model: formatModelId(voice.model),
            voice: voice.voice_id,
            language: voice.language ?? "en",
        });

    } else if (voice.provider === "elevenlabs") {
        tts = new elevenlabs.TTS({
            modelID: voice.model,
            voiceId: voice.voice_id,
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