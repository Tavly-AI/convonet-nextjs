import type { CFSubflowComponent } from "../_types/global-cf-types"

const KEY = "flow-subflow-data-v1"
const EVENT = `${KEY}:change`

type Store = Record<string, CFSubflowComponent>

const read = (): Store => JSON.parse(sessionStorage.getItem(KEY) || "{}")
const write = (store: Store) => {
    sessionStorage.setItem(KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(EVENT))
}

export const subflow_session_storage = {
    get(id: string) {
        return read()[id]
    },

    getAll() {
        return read()
    },

    set(data: CFSubflowComponent) {
        if (!data.conversation_flow_component_id) return
        write({ ...read(), [data.conversation_flow_component_id]: data })
    },

    // removes subflow
    remove(id: string) {
        const store = read()
        delete store[id]
        write(store)
    },

    // removes nodes inside subflow
    removeNode(subflowId: string, nodeId: string) {
        const subflow = this.get(subflowId)
        if (!subflow) return

        this.set({
            ...subflow,
            nodes: subflow.nodes.filter(node => node.id !== nodeId),
        })
    },

    subscribe(fn: () => void) {
        window.addEventListener(EVENT, fn)
        return () => window.removeEventListener(EVENT, fn)
    },
}
