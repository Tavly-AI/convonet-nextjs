import type { CF } from "../_types/global-cf-types"

export const CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY = "flow-node-data"
const EVENT = `${CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY}:change`
const KEY = CONVERSTAIONAL_FLOW_SESSION_STORAGE_KEY

type Store = Record<string, CF["Node"]["data"]>

const EMPTY_CONVERSATIONAL_FLOW: Store = {}

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
}
