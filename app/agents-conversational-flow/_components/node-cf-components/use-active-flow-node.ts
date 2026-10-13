import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import type { CF } from "../../_types/global-cf-types"
import { conversational_flow_session_storage } from "../../_lib/flow-sessionStorage"
import { subflow_session_storage } from "../../_lib/flow-subflow-sessonStorage"

export function useActiveFlowNode<T extends CF["Type"]>(type: T, id: string, fallback: CF["Data"][T]) {

    // resolve subflow
    const subflowId = useSearchParams().get("subflow")
    const getNode = useCallback(() => {
        if (!subflowId) return conversational_flow_session_storage.get(type, id) ?? fallback

        const node = subflow_session_storage.get(subflowId)?.nodes.find(node => node.id === id)
        return node?.type === type ? node as CF["Data"][T] : fallback
    }, [subflowId, type, id, fallback])

    // save node-data on runtime
    const [savedNode, setSavedNode] = useState(getNode)

    // subsribe to sessionStorage
    useEffect(() => {
        const sync = () => setSavedNode(getNode())
        return subflowId ? subflow_session_storage.subscribe(sync) : conversational_flow_session_storage.subscribe(sync)
    }, [getNode, subflowId])

    // update sessionStrorage on node-data-updation
    const update = (fn: (node: CF["Data"][T]) => CF["Data"][T]) => {
        if (!subflowId) return conversational_flow_session_storage.update(type, id, fn)

        const subflow = subflow_session_storage.get(subflowId)
        if (subflow) subflow_session_storage.set({ ...subflow, nodes: subflow.nodes.map(node => node.id === id ? fn(node as CF["Data"][T]) : node) })
    }

    return [savedNode, update] as const
}
