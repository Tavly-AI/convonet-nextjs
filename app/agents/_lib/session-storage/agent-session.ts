"use client"

import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const SESSION_KEY = "agent-session"

export type AgentSessionConfig = Record<string, unknown> & {
    agentType: string
    voiceId: string | null
    phoneNumber: string | null
    generalTools: GeneralTool[]
}

export type AgentSessionAgent = {
    id: string | null
    workspaceId: string | null
    name: string
    config: AgentSessionConfig
    llmConfig: Record<string, unknown>
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
    config: {
        agentType: "single_prompt",
        voiceId: null,
        phoneNumber: null,
        generalTools: [],
    },
    llmConfig: {},
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
        llmConfig: agent?.llmConfig ?? EMPTY_AGENT.llmConfig,
    })
}

export function writeAgentSession(agent: AgentSessionAgent) {
    getStorage()?.setItem(SESSION_KEY, JSON.stringify(agent))
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

function getStorage() {
    return typeof window === "undefined" ? null : window.sessionStorage
}
