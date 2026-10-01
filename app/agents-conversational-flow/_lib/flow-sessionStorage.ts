import type { CF } from "../_types/global-cf-types"

const KEY = "flow-node-data", EVENT = `${KEY}:change`
type Store = Record<string, CF["Node"]["data"]>

const getStore = (): Store => {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "{}") }
    catch { return {} }
}

const setStore = (store: Store) => {
    sessionStorage.setItem(KEY, JSON.stringify(store))
    window.dispatchEvent(new Event(EVENT))
}

export const getFlowNodeData = <T extends CF["Type"]>(type: T, id: string) => {
    const node = getStore()[id]
    return node?.type === type ? node as CF["Data"][T] : undefined
}

export const setFlowNodeData = (data: CF["Node"]["data"]) =>
    setStore({ ...getStore(), [data.id]: data })

export const updateFlowNodeData = <T extends CF["Type"]>(type: T, id: string, fn: (node: CF["Data"][T]) => CF["Data"][T]) => {
    const node = getFlowNodeData(type, id)
    if (node) setFlowNodeData(fn(node))
}

export const deleteFlowNodeData = (id: string) => {
    const store = getStore()
    delete store[id]
    setStore(store)
}

export const subscribeToFlowNodeData = (fn: () => void) => {
    window.addEventListener(EVENT, fn)
    return () => window.removeEventListener(EVENT, fn)
}