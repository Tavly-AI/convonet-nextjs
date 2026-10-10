import type { CFSubflowComponent } from "../_types/global-cf-types"

const KEY = "flow-subflow-data-v1"

type Store = Record<string, CFSubflowComponent>

const read = (): Store => JSON.parse(sessionStorage.getItem(KEY) || "{}")
const write = (store: Store) => sessionStorage.setItem(KEY, JSON.stringify(store))

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

    remove(id: string) {
        const store = read()
        delete store[id]
        write(store)
    },
}