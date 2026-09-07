"use client"

import { autoSaveAgentSession } from "@/app/agents/actions"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"
import type { McpConfig } from "@/app/agents/_lib/mcp/mcp"
import { getAgentTemplates } from "../../_data/templates-data-list"

const SESSION_KEY = "agent-session"

export type PronunciationDictionaryEntry = {
    word: string
    alphabet: "ipa" | "pinyin" | "jyutping"
    phoneme: string
}

export type AgentLanguage = string | string[]

export type SpeechSettings = {
    ambient_sound: string
    responsiveness: number
    enable_dynamic_responsiveness: boolean
    interruption_sensitivity: number
    reminder_trigger_ms: number
    reminder_max_count: number
    pronunciation_dictionary: PronunciationDictionaryEntry[]
}

// ===================================================================
// ==================== HANDBOOK DEFAULT & TYPES =====================
// ===================================================================

export type HandbookConfig = {
    default_personality: boolean
    conversational_personality: boolean
    natural_filler_words: boolean
    high_empathy: boolean
    echo_verification: boolean
    nato_phonetic_alphabet: boolean
    speech_normalization: boolean
    smart_matching: boolean
    ai_disclosure: boolean
    scope_boundaries: boolean
}

export const DEFAULT_HANDBOOK_CONFIG = {
    default_personality: true,
    conversational_personality: true,
    natural_filler_words: true,
    high_empathy: true,
    echo_verification: true,
    nato_phonetic_alphabet: true,
    speech_normalization: true,
    smart_matching: true,
    ai_disclosure: true,
    scope_boundaries: true,
} satisfies HandbookConfig

// =================================================================
// ================ HANDBOOK DEFAULT & TYPES END ===================
// =================================================================


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

export type WebhookEvent =
    | "call_started"
    | "call_ended"
    | "call_analyzed"
    | "transcript_updated"
    | "transfer_started"
    | "transfer_bridged"
    | "transfer_cancelled"
    | "transfer_ended"

export type WebhookSettings = {
    webhook_url: string | null
    webhook_events: WebhookEvent[]
    webhook_timeout_ms: number
}


// =================================================================
// ===================== CHAT DEFAULT & TYPES ======================
// =================================================================

export type ChatSettings = {
    auto_close_message: string | null
}

export const DEFAULT_CHAT_SETTINGS = {
    auto_close_message: "Thank you for chatting. The conversation has ended.",
} satisfies ChatSettings

// =================================================================
// ================== SECURITY DEFAULT & TYPES =====================
// =================================================================


export type DataStorageSetting =
    | "everything"
    | "everything_except_pii"
    | "basic_attributes_only"

export type PiiCategory =
    | "person_name"
    | "address"
    | "email"
    | "phone_number"
    | "ssn"
    | "passport"
    | "driver_license"
    | "credit_card"
    | "bank_account"
    | "password"
    | "pin"
    | "medical_id"
    | "date_of_birth"
    | "customer_account_number"

export type GuardrailOutputTopic =
    | "harassment"
    | "self_harm"
    | "sexual_exploitation"
    | "violence"
    | "defense_and_national_security"
    | "illicit_and_harmful_activity"
    | "gambling"
    | "regulated_professional_advice"
    | "child_safety_and_exploitation"

export type GuardrailInputTopic = "platform_integrity_jailbreaking"

export type SecurityFallbackSettings = {
    data_storage_setting: DataStorageSetting
    data_storage_retention_days: number | null
    opt_in_signed_url: boolean
    signed_url_expiration_ms: number | null
    pii_config: {
        mode: "post_call"
        categories: PiiCategory[]
    }
    guardrail_config: {
        output_topics: GuardrailOutputTopic[]
        input_topics: GuardrailInputTopic[]
    }
}

export const DEFAULT_SECURITY_FALLBACK_SETTINGS = {
    data_storage_setting: "everything",
    data_storage_retention_days: null,
    opt_in_signed_url: false,
    signed_url_expiration_ms: 86400000,
    pii_config: {
        mode: "post_call",
        categories: [],
    },
    guardrail_config: {
        output_topics: [],
        input_topics: [],
    },
} satisfies SecurityFallbackSettings

// =================================================================
// ================ SECURITY DEFAULT & TYPES END ===================
// =================================================================


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


export type PostCallAnalysisModel = string

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

export const DEFAULT_WEBHOOK_SETTINGS = {
    webhook_url: null,
    webhook_events: [],
    webhook_timeout_ms: 10000,
} satisfies WebhookSettings

// =================================================================
// ================ CALL SETTINGS DEFAULT END ======================
// =================================================================


export type AgentSessionConfig = Record<string, unknown> & {
    agentType: string
    voiceId: string | null
    language: AgentLanguage
    phoneNumber: string | null
    generalTools: GeneralTool[]
    webhook_url: string | null
    webhook_events: WebhookEvent[]
    webhook_timeout_ms: number
    data_storage_setting: DataStorageSetting
    data_storage_retention_days: number | null
    opt_in_signed_url: boolean
    signed_url_expiration_ms: number | null
    pii_config: SecurityFallbackSettings["pii_config"]
    guardrail_config: SecurityFallbackSettings["guardrail_config"]
    post_call_analysis_data: PostCallAnalysisData[]
    post_call_analysis_model: PostCallAnalysisModel
    handbook_config?: HandbookConfig
    timezone?: string

    auto_close_message?: string | null
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
    channel: "voice" | "chat"
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
    channel: "voice",
    name: "Untitled Agent",
    draftVersion: 1,
    config: {
        ...DEFAULT_CALL_SETTINGS,
        ...DEFAULT_WEBHOOK_SETTINGS,
        ...DEFAULT_SECURITY_FALLBACK_SETTINGS,
        ...DEFAULT_POST_CALL_ANALYSIS_SETTINGS,

        handbook_config: DEFAULT_HANDBOOK_CONFIG,
        timezone: "America/New_York",

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

const EMPTY_CHAT_AGENT: AgentSessionAgent = {
    id: null,
    workspaceId: null,
    channel: "chat",
    name: "Untitled Agent",
    draftVersion: 1,
    config: {
        ...DEFAULT_CHAT_SETTINGS,
        ...DEFAULT_WEBHOOK_SETTINGS,
        ...DEFAULT_SECURITY_FALLBACK_SETTINGS,
        ...DEFAULT_POST_CALL_ANALYSIS_SETTINGS,

        handbook_config: DEFAULT_HANDBOOK_CONFIG,
        timezone: "America/New_York",

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
            webhook_events: Array.isArray(storedConfig.webhook_events)
                ? storedConfig.webhook_events as WebhookEvent[]
                : EMPTY_AGENT.config.webhook_events,
            pii_config: {
                ...EMPTY_AGENT.config.pii_config,
                ...(typeof storedConfig.pii_config === "object" && storedConfig.pii_config
                    ? storedConfig.pii_config
                    : {}),
                categories: Array.isArray((storedConfig.pii_config as { categories?: unknown } | undefined)?.categories)
                    ? (storedConfig.pii_config as { categories: PiiCategory[] }).categories
                    : EMPTY_AGENT.config.pii_config.categories,
            },
            guardrail_config: {
                ...EMPTY_AGENT.config.guardrail_config,
                ...(typeof storedConfig.guardrail_config === "object" && storedConfig.guardrail_config
                    ? storedConfig.guardrail_config
                    : {}),
                output_topics: Array.isArray((storedConfig.guardrail_config as { output_topics?: unknown } | undefined)?.output_topics)
                    ? (storedConfig.guardrail_config as { output_topics: GuardrailOutputTopic[] }).output_topics
                    : EMPTY_AGENT.config.guardrail_config.output_topics,
                input_topics: Array.isArray((storedConfig.guardrail_config as { input_topics?: unknown } | undefined)?.input_topics)
                    ? (storedConfig.guardrail_config as { input_topics: GuardrailInputTopic[] }).input_topics
                    : EMPTY_AGENT.config.guardrail_config.input_topics,
            },
            handbook_config: {
                ...EMPTY_AGENT.config.handbook_config,
                ...(typeof storedConfig.handbook_config === "object" && storedConfig.handbook_config
                    ? storedConfig.handbook_config
                    : {}),
            } as HandbookConfig,
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

export function initializeChatAgentSession(
    agent: AgentSessionSource | null = null
) {
    const storage = getStorage()
    const storedConfig = agent?.config ?? {}
    const storedLlmConfig = agent?.llmConfig ?? {}

    storage?.removeItem("agent-session:fresh")
    storage?.removeItem("agent-session:stale")

    return writeAgentSession({
        ...EMPTY_CHAT_AGENT,
        ...agent,
        channel: "chat",
        config: {
            ...EMPTY_CHAT_AGENT.config,
            ...storedConfig,

            generalTools: Array.isArray(storedConfig.generalTools)
                ? storedConfig.generalTools as GeneralTool[]
                : EMPTY_CHAT_AGENT.config.generalTools,

            webhook_events: Array.isArray(storedConfig.webhook_events)
                ? storedConfig.webhook_events as WebhookEvent[]
                : EMPTY_CHAT_AGENT.config.webhook_events,

            pii_config: {
                ...EMPTY_CHAT_AGENT.config.pii_config,
                ...(typeof storedConfig.pii_config === "object" && storedConfig.pii_config
                    ? storedConfig.pii_config
                    : {}),
                categories: Array.isArray(
                    (storedConfig.pii_config as { categories?: unknown } | undefined)?.categories
                )
                    ? (storedConfig.pii_config as { categories: PiiCategory[] }).categories
                    : EMPTY_CHAT_AGENT.config.pii_config.categories,
            },

            guardrail_config: {
                ...EMPTY_CHAT_AGENT.config.guardrail_config,
                ...(typeof storedConfig.guardrail_config === "object" && storedConfig.guardrail_config
                    ? storedConfig.guardrail_config
                    : {}),
                output_topics: Array.isArray(
                    (storedConfig.guardrail_config as { output_topics?: unknown } | undefined)?.output_topics
                )
                    ? (storedConfig.guardrail_config as { output_topics: GuardrailOutputTopic[] }).output_topics
                    : EMPTY_CHAT_AGENT.config.guardrail_config.output_topics,

                input_topics: Array.isArray(
                    (storedConfig.guardrail_config as { input_topics?: unknown } | undefined)?.input_topics
                )
                    ? (storedConfig.guardrail_config as { input_topics: GuardrailInputTopic[] }).input_topics
                    : EMPTY_CHAT_AGENT.config.guardrail_config.input_topics,
            },
            handbook_config: {
                ...EMPTY_CHAT_AGENT.config.handbook_config,
                ...(typeof storedConfig.handbook_config === "object" && storedConfig.handbook_config
                    ? storedConfig.handbook_config
                    : {}),
            } as HandbookConfig,
        },

        llmConfig: {
            ...EMPTY_CHAT_AGENT.llmConfig,
            ...storedLlmConfig,

            mcps: Array.isArray(storedLlmConfig.mcps)
                ? storedLlmConfig.mcps as McpConfig[]
                : EMPTY_CHAT_AGENT.llmConfig.mcps,
        },
    }, false)
}

export function initializeAgentFromTemplate({ agentId, channel, template, agentType }: { agentId: string, channel: string, template: string, agentType: string }) {
    const templates = getAgentTemplates()


    // ==================================================================
    // =================== INIT VOICE AGENT =============================
    // ==================================================================

    if (!(template in templates)) { return initializeAgentSession() }

    const templateData = templates[template as keyof typeof templates]

    // this only runs for voice-agents and there are no template-param in chat-agent
    return initializeAgentSession({
        ...EMPTY_AGENT,
        id: agentId,
        channel: channel === "chat" ? "chat" : "voice",
        name: templateData.name,
        config: {
            ...EMPTY_AGENT.config,
            ...templateData.config,
            agentType,
        },
        llmConfig: {
            ...EMPTY_AGENT.llmConfig,
            ...templateData.llmConfig,
        },
    })
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
// ================= HANDBOOK & TIMEZONE SETTINGS ================
// =================================================================

export function getHandbookConfig(): HandbookConfig {
    return {
        ...DEFAULT_HANDBOOK_CONFIG,
        ...(getAgentSession()?.config.handbook_config ?? {}),
    }
}

export function writeHandbookConfig(handbook_config: Partial<HandbookConfig>) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    const nextConfig = {
        ...getHandbookConfig(),
        ...handbook_config,
    }

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            handbook_config: nextConfig,
        },
    })

    return nextConfig
}

export function getTimezone() {
    return getAgentSession()?.config.timezone ?? "America/New_York"
}

export function writeTimezone(timezone: string) {
    const agent = getAgentSession()
    if (!agent) throw new Error("Agent session is not initialized.")

    writeAgentSession({
        ...agent,
        config: {
            ...agent.config,
            timezone,
        },
    })

    return timezone
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
// ======================= WEBHOOK SETTINGS ========================
// =================================================================

export function getWebhookSettings(): Partial<WebhookSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<WebhookSettings>
}

export function writeWebhookSettings(settings: Partial<WebhookSettings>) {
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
// ========================= CHAT SETTINGS =========================
// =================================================================

export function getChatSettings(): Partial<ChatSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<ChatSettings>
}

export function writeChatSettings(settings: Partial<ChatSettings>) {
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
// ================= SECURITY & FALLBACK SETTINGS ==================
// =================================================================

export function getSecurityFallbackSettings(): Partial<SecurityFallbackSettings> {
    return (getAgentSession()?.config ?? {}) as Partial<SecurityFallbackSettings>
}

export function writeSecurityFallbackSettings(settings: Partial<SecurityFallbackSettings>) {
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

export function getLanguage(): AgentLanguage {
    return getAgentSession()?.config.language ?? "en-US"
}

export function writeLanguage(language: AgentLanguage) {
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
