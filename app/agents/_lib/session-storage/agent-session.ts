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

export type AgentSessionConfig = Record<string, unknown> & {
    agentType: string
    voiceId: string | null
    phoneNumber: string | null
    generalTools: GeneralTool[]
}

export type AgentSessionLlmConfig = Record<string, unknown> & {
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
        agentType: "single_prompt",
        voiceId: null,
        phoneNumber: null,
        generalTools: [],
    },
    llmConfig: {
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
        },
        llmConfig: {
            ...EMPTY_AGENT.llmConfig,
            ...storedLlmConfig,
            mcps: Array.isArray(storedLlmConfig.mcps)
                ? storedLlmConfig.mcps as McpConfig[]
                : EMPTY_AGENT.llmConfig.mcps,
        },
    })
}

export function writeAgentSession(agent: AgentSessionAgent) {
    getStorage()?.setItem(SESSION_KEY, JSON.stringify(agent))
    scheduleAgentSessionAutoSave(agent)
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
