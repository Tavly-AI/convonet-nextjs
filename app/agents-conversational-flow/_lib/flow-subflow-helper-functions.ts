import type { CF } from "../_types/global-cf-types"
import { subflow_session_storage } from "./flow-subflow-sessonStorage"
import { conversational_flow_session_storage } from "./flow-sessionStorage"

function getSubflowId(): string | null {
    if (typeof window === "undefined") return null
    return new URLSearchParams(window.location.search).get("subflow")
}

export function flowHelperSaveFlowNode(data: CF["Node"]["data"]) {

    const subflowId = getSubflowId()

    // Save node to subflow
    if (subflowId) {
        const subflow = subflow_session_storage.get(subflowId)
        if (!subflow) return

        subflow_session_storage.set({ ...subflow, nodes: [...subflow.nodes, data], })
        return
    }

    // Save node to main flow
    conversational_flow_session_storage.set(data)
}


export function flowHelperGetFlowNodesFromSessionStorage(): CF["Node"][] {
    const subflowId = getSubflowId()

    // Get nodes from subflow
    if (subflowId) {
        const subflow = subflow_session_storage.get(subflowId)
        const subflowNodes = subflow?.nodes ?? []
        return subflowNodes.map(data => ({ id: data.id, type: data.type, position: data.display_position, data, }) as CF["Node"])
    }

    // Get nodes from main flow
    const mainFlowNodes = Object.values(conversational_flow_session_storage.getAll())
    return mainFlowNodes.map(data => ({ id: data.id, type: data.type, position: data.display_position, data, }) as CF["Node"])
}


export function flowHelperUpdateFlowNode(data: CF["Node"]["data"]) {
    const subflowId = getSubflowId()

    // Update node in subflow
    if (subflowId) {
        const subflow = subflow_session_storage.get(subflowId)
        if (!subflow) return

        subflow_session_storage.set({ ...subflow, nodes: subflow.nodes.map(node => node.id === data.id ? data : node), })
        return
    }

    // Update node in main flow
    conversational_flow_session_storage.set(data)
}