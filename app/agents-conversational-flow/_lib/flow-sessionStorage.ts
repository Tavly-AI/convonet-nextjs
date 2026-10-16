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

const EMPTY_CONVERSATIONAL_FLOW: Store = {}

export function initializeConversaionalAgentScratchFlow(conversationalFlowDBDetails?: MainflowSubflowConfig) {
    conversational_flow_session_storage.setAll(conversationalFlowDBDetails?.mainFlowConfig ?? { ...EMPTY_CONVERSATIONAL_FLOW })
    subflow_session_storage.setAll(conversationalFlowDBDetails?.subflowConfig ?? {})
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