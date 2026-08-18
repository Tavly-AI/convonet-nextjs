"use client"

import { autoSaveAgentSession } from "@/app/agents/actions"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"
import type { McpConfig } from "@/app/agents/_lib/mcp/mcp"

const SESSION_KEY = "agent-session"

export type PronunciationDictionaryEntry = {
    word: string
    alphabet: "ipa" | "pinyin" | "jyutping"
    phoneme: string
}

export type SpeechSettings = {
    ambient_sound: string
    responsiveness: number
    enable_dynamic_responsiveness: boolean
    interruption_sensitivity: number
    reminder_trigger_ms: number
    reminder_max_count: number
    pronunciation_dictionary: PronunciationDictionaryEntry[]
}

export type DenoisingMode =
    | "noise-cancellation"
    | "noise-and-background-speech-cancellation"
    | "no-denoise"

export type SttMode = "fast" | "accurate" | "custom"

export type CustomSttConfig = {
    endpointing_ms?: number
    provider?: string
}

export type RealtimeTranscriptionSettings = {
    denoising_mode: DenoisingMode
    stt_mode: SttMode
    custom_stt_config: CustomSttConfig | null
    boosted_keywords: string[]
}

export type VoicemailAction =
    | {
        type: "prompt"
        text: string
    }
    | {
        type: "static_text"
        text: string
    }
    | {
        type: "hangup"
    }
    | {
        type: "bridge_transfer"
    }

export type VoicemailOption = {
    action: VoicemailAction
    detection_prompt?: string | null
} | null

export type IvrOption = {
    action: {
        type: "hangup"
    }
    detection_prompt?: string | null
} | null

export type CallScreeningOption = {
    agent_identity: string
    call_purpose: string
} | null

export type UserDtmfOptions = {
    digit_limit: number
    termination_key: "#" | "*" | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
    timeout_ms: number
}

export type CallSettings = {
    voicemail_option: VoicemailOption
    ivr_option: IvrOption
    call_screening_option: CallScreeningOption
    allow_user_dtmf: boolean

    allow_dtmf_interruption: boolean
    user_dtmf_options: UserDtmfOptions

    end_call_after_silence_ms: number
    max_call_duration_ms: number
    ring_duration_ms: number
}

// =================================================================
// ================= POST CALL DEFAULT & TYPES =====================
// =================================================================


export type PostCallAnalysisModel =
    | "gpt-4.1"
    | "gpt-4.1-mini"
    | "gpt-4.1-nano"
    | "gpt-5"
    | "gpt-5-mini"
    | "gpt-5-nano"

export type PostCallAnalysisData = {
    type: "string" | "number" | "boolean" | "enum" | "system-presets"
    name: string
    description: string
    examples?: string[]
    choices?: string[]
    required?: boolean
    conditional_prompt?: string
}

export type PostCallAnalysisSettings = {
    post_call_analysis_data: PostCallAnalysisData[]
    post_call_analysis_model: PostCallAnalysisModel
}

export const DEFAULT_POST_CALL_ANALYSIS_SETTINGS = {
    post_call_analysis_data: [],
    post_call_analysis_model: "gpt-4.1",
} satisfies PostCallAnalysisSettings



// =================================================================
// ==================== CALL SETTINGS DEFAULT ======================
// =================================================================

export const DEFAULT_USER_DTMF_OPTIONS = {
    digit_limit: 10,
    termination_key: "#",
    timeout_ms: 2500,
} satisfies UserDtmfOptions

export const DEFAULT_CALL_SETTINGS = {
    voicemail_option: null,
    ivr_option: null,
    call_screening_option: null,
    allow_user_dtmf: false,
    allow_dtmf_interruption: false,
    user_dtmf_options: DEFAULT_USER_DTMF_OPTIONS,
    end_call_after_silence_ms: 600000,
    max_call_duration_ms: 3600000,
    ring_duration_ms: 30000,
} satisfies CallSettings

// =================================================================
// ================ CALL SETTINGS DEFAULT END ======================
// =================================================================


export type AgentSessionConfig = Record<string, unknown> & {
    agentType: string
    voiceId: string | null
    language: string
    phoneNumber: string | null
    generalTools: GeneralTool[]
    post_call_analysis_data: PostCallAnalysisData[]
    post_call_analysis_model: PostCallAnalysisModel
}

export type AgentSessionLlmConfig = Record<string, unknown> & {
    model: string
    generalPrompt: string
    mcps: McpConfig[]
}

export type AgentSessionAgent = {
    id: string | null
    workspaceId: string | null
    name: string
    draftVersion: number
    config: AgentSessionConfig
    llmConfig: AgentSessionLlmConfig
    createdAt: string | null
    updatedAt: string | null
}

export type AgentSessionSource = Omit<AgentSessionAgent, "config" | "llmConfig"> & {
    config: Record<string, unknown>
    llmConfig: Record<string, unknown>
}

const EMPTY_AGENT: AgentSessionAgent = {
    id: null,
    workspaceId: null,
    name: "Untitled Agent",
    draftVersion: 1,
    config: {
        ...DEFAULT_CALL_SETTINGS,
        ...DEFAULT_POST_CALL_ANALYSIS_SETTINGS,
        agentType: "single_prompt",
        voiceId: null,
        language: "en-US",
        phoneNumber: null,
        generalTools: [],
    },
    llmConfig: {
        model: "gpt-4.1",
        generalPrompt: "",
        mcps: [],
    },
    createdAt: null,
    updatedAt: null,
}


// =================================================================
// ======================== AGENT SESSIONS =========================
// =================================================================


export function getAgentSession(): AgentSessionAgent | null {
    const value = getStorage()?.getItem(SESSION_KEY)
    if (!value) return null

    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

export function initializeAgentSession(agent: AgentSessionSource | null = null) {
    const storage = getStorage()
    const storedConfig = agent?.config ?? {}
    const storedLlmConfig = agent?.llmConfig ?? {}

    storage?.removeItem("agent-session:fresh")
    storage?.removeItem("agent-session:stale")

    return writeAgentSession({
        ...EMPTY_AGENT,
        ...agent,
        config: {
            ...EMPTY_AGENT.config,
            ...storedConfig,
            generalTools: Array.isArray(storedConfig.generalTools)
                ? storedConfig.generalTools as GeneralTool[]
                : EMPTY_AGENT.config.generalTools,
            post_call_analysis_data: Array.isArray(storedConfig.post_call_analysis_data)
                ? storedConfig.post_call_analysis_data as PostCallAnalysisData[]
                : EMPTY_AGENT.config.post_call_analysis_data,
            post_call_analysis_model:
                storedConfig.post_call_analysis_model === undefined
                    ? EMPTY_AGENT.config.post_call_analysis_model
                    : storedConfig.post_call_analysis_model as PostCallAnalysisModel,
        },
        llmConfig: {
            ...EMPTY_AGENT.llmConfig,
            ...storedLlmConfig,
            mcps: Array.isArray(storedLlmConfig.mcps)
                ? storedLlmConfig.mcps as McpConfig[]
                : EMPTY_AGENT.llmConfig.mcps,
        },
    }, false)
}

export function writeAgentSession(agent: AgentSessionAgent, autoSave = true) {
    getStorage()?.setItem(SESSION_KEY, JSON.stringify(agent))
    if (autoSave) scheduleAgentSessionAutoSave(agent)
    return agent
}

export function clearAgentSession() {
    getStorage()?.removeItem(SESSION_KEY)
}

// =================================================================
// ========================= GENERAL TOOLS =========================
// =================================================================

export function getGeneralTools() {
    return getAgentSession()?.config.generalTools ?? []
}

export function writeGeneralTools(tools: GeneralTool[]) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            generalTools: tools,
        },
    })

    return tools
}

// =================================================================
// ======================== SPEECH SETTINGS ========================
// =================================================================

export function getSpeechSettings(): Partial<SpeechSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<SpeechSettings>
}

export function writeSpeechSettings(settings: Partial<SpeechSettings>) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            ...settings,
        },
    })

    return settings
}

// =================================================================
// ================= REALTIME TRANSCRIPTION SETTINGS ================
// =================================================================

export function getRealtimeTranscriptionSettings(): Partial<RealtimeTranscriptionSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<RealtimeTranscriptionSettings>
}

export function writeRealtimeTranscriptionSettings(
    settings: Partial<RealtimeTranscriptionSettings>
) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            ...settings,
        },
    })

    return settings
}

// =================================================================
// ========================== CALL SETTINGS =========================
// =================================================================

export function getCallSettings(): Partial<CallSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<CallSettings>
}

export function writeCallSettings(settings: Partial<CallSettings>) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            ...settings,
        },
    })

    return settings
}

// =================================================================
// ===================== POST CALL ANALYSIS ========================
// =================================================================

export function getPostCallAnalysisSettings(): Partial<PostCallAnalysisSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<PostCallAnalysisSettings>
}

export function writePostCallAnalysisSettings(settings: Partial<PostCallAnalysisSettings>) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            ...settings,
        },
    })

    return settings
}

// =================================================================
// ============================== MCPS ==============================
// =================================================================

export function getMcps() {
    return getAgentSession()?.llmConfig.mcps ?? []
}

export function writeMcps(mcps: McpConfig[]) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        llmConfig: {
            ...agent.llmConfig,
            mcps,
        },
    })

    return mcps
}

function getStorage() {
    return typeof window === "undefined" ? null : window.sessionStorage
}

// =================================================================
// ========================== AUTO SAVE ============================
// =================================================================

function scheduleAgentSessionAutoSave(agent: AgentSessionAgent) {
    if (!agent.id) return

    window.setTimeout(() => {
        void autoSaveAgentSession(agent).catch(console.error)
    }, 1000)
}


// =================================================================
// ========================== VOICE TTS ============================
// =================================================================

export function getVoiceId() {
    return getAgentSession()?.config.voiceId ?? null
}

export function writeVoiceId(voiceId: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            voiceId,
        },
    })
    return voiceId
}

// =================================================================
// =========================== LANGUAGE =============================
// =================================================================

export function getLanguage() {
    return getAgentSession()?.config.language ?? "en-US"
}

export function writeLanguage(language: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            language,
        },
    })

    return language
}

// =================================================================
// ============================= MODEL ==============================
// =================================================================

export function getModel() {
    return getAgentSession()?.llmConfig.model ?? "gpt-4.1"
}

export function writeModel(model: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        llmConfig: {
            ...agent.llmConfig,
            model,
        },
    })

    return model
}

// =================================================================
// ========================= GENERAL PROMPT =========================
// =================================================================

export function getGeneralPrompt() {
    return getAgentSession()?.llmConfig.generalPrompt ?? ""
}

export function writeGeneralPrompt(generalPrompt: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        llmConfig: {
            ...agent.llmConfig,
            generalPrompt,
        },
    })

    return generalPrompt
}


// =================================================================
// =========================== AGENT NAME ===========================
// =================================================================

export function getAgentName() {
    return getAgentSession()?.name ?? "Untitled Agent"
}

export function writeAgentName(name: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        name,
    })

    return name
}
