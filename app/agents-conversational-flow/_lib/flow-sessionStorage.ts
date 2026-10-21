import { getGeneralPrompt, writeAgentType, writeGeneralPrompt } from "@/app/agents/_lib/session-storage/agent-session"
import type { CF, MainflowSubflowConfig } from "../_types/global-cf-types"
import { subflow_session_storage } from "./flow-subflow-sessonStorage"

export const CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY = "flow-node-data"
const EVENT = `${CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY}:change`
const KEY = CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY

type Store = Record<string, CF["Node"]["data"]>

const read = (): Store => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || JSON.stringify(EMPTY_CONVERSATIONAL_FLOW)) }
    catch { return EMPTY_CONVERSATIONAL_FLOW }
}

const write = (store: Store) => {
    sessionStorage.setItem(KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(EVENT))

    // hack: ensure agent type matches URL

    // hack: sync agent type to "conversational_flow" if URL matches
    if (new URLSearchParams(window.location.search).get("agentType") === "conversational_flow") {
        writeAgentType("conversational_flow")
    } else {
        // ultimate hack: trigger db save pipeline
        writeGeneralPrompt(getGeneralPrompt())
    }
}

export const conversational_flow_session_storage = {
    get<T extends CF["Type"]>(type: T, id: string) {
        const node = read()[id]
        return node?.type === type ? node as CF["Data"][T] : undefined
    },

    getAll() { return read() },

    set(data: CF["Node"]["data"]) { write({ ...read(), [data.id]: data }) },

    update<T extends CF["Type"]>(type: T, id: string, fn: (node: CF["Data"][T]) => CF["Data"][T]) {
        const node = this.get(type, id)
        if (node) this.set(fn(node))
    },

    subscribe(fn: () => void) {
        window.addEventListener(EVENT, fn)
        return () => window.removeEventListener(EVENT, fn)
    },

    remove(id: string) {
        const store = read()
        delete store[id]
        write(store)
    },

    // used onPageLoad
    setAll(store: Store) {
        write(store)
    },
}



// ==================================================================
// ================== HANDLE INIT TEMPLATES =========================
// ==================================================================

const EMPTY_CONVERSATIONAL_FLOW: Store = {
    "begin-node": {
        id: "begin-node",
        type: "begin",
        name: "Begin",
        skippable: false,
        display_position: { x: 0, y: 0 },
        edge: {
            id: "begin-edge",
            destination_node_id: "conversation-node",
            transition_condition: { type: "prompt", prompt: "Always" },
        },
    },
    "conversation-node": {
        id: "conversation-node",
        type: "conversation",
        name: "Conversation",
        skippable: false,
        display_position: { x: 400, y: 0 },
        start_speaker: "agent",
        instruction: { type: "prompt", text: "" },
        edges: [{
            id: "conversation-end-edge",
            destination_node_id: "end-node",
            transition_condition: { type: "prompt", prompt: "The conversation is complete." },
        }],
    },
    "end-node": {
        id: "end-node",
        type: "end",
        name: "End",
        skippable: false,
        display_position: { x: 800, y: 0 },
        instruction: { type: "prompt", text: "Say goodbye and end the call." },
    },
}

export function initializeConversaionalAgentScratchFlow(conversationalFlowDBDetails?: MainflowSubflowConfig) {
    const mainFlowConfig = conversationalFlowDBDetails?.mainFlowConfig
    const subflowConfig = conversationalFlowDBDetails?.subflowConfig

    conversational_flow_session_storage.setAll(mainFlowConfig && Object.keys(mainFlowConfig).length > 0 ? mainFlowConfig : { ...EMPTY_CONVERSATIONAL_FLOW })
    subflow_session_storage.setAll(subflowConfig && Object.keys(subflowConfig).length > 0 ? subflowConfig : {})
}


export async function initializeConversationalFlowAgentFromTemplate(templateId: string) {

    // hack: to fix the file-loading race-issue
    const { getConversationalFlowTemplates } = await import("@/app/agents/_data/templates-conversational-flow")

    const templates = getConversationalFlowTemplates()
    const templateExists = Object.prototype.hasOwnProperty.call(templates, templateId)
    if (!templateExists) { throw new Error(`Unknown conversational flow template: ${templateId}`) }
    const template = templates[templateId as keyof typeof templates]

    conversational_flow_session_storage.setAll(template.mainFlowConfig)
    subflow_session_storage.setAll(template.subflowConfig)

    return template
}
