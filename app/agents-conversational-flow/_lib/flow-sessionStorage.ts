import type { CF } from "../_types/global-cf-types"

const KEY = "flow-node-data", EVENT = `${KEY}:change`
type Store = Record<string, CF["Node"]["data"]>

const EMPTY_CONVERSATIONAL_FLOW = {
    begin: {
        id: "begin",
        type: "begin",
        name: "Begin",
        skippable: false,
        display_position: { x: 0, y: 0 },
        edge: { id: "begin-edge", transition_condition: { type: "prompt", prompt: "Start" } },
    },
} satisfies Store

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

    set(data: CF["Node"]["data"]) { write({ ...read(), [data.id]: data }) },

    update<T extends CF["Type"]>(type: T, id: string, fn: (node: CF["Data"][T]) => CF["Data"][T]) {
        const node = this.get(type, id)
        if (node) this.set(fn(node))
    },

    subscribe(fn: () => void) {
        window.addEventListener(EVENT, fn)
        return () => window.removeEventListener(EVENT, fn)
    },
}
