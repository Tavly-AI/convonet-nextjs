import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { Workflow } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { conversational_flow_session_storage } from "../../_lib/flow-sessionStorage"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { TransitionEditor } from "./TransitionEditor"

export function SubFlowCustomNode({ id, data: node, selected }: NodeProps<CF["Nodes"]["subflow"]>) {
    const [savedNode, setSavedNode] = useState(() => conversational_flow_session_storage.get("subflow", id) ?? node)
    const update = (fn: (node: CF["Data"]["subflow"]) => CF["Data"]["subflow"]) => conversational_flow_session_storage.update("subflow", id, fn)

    useEffect(() => conversational_flow_session_storage.subscribe(() => {
        const updatedNode = conversational_flow_session_storage.get("subflow", id)
        if (updatedNode) setSavedNode(updatedNode)
    }), [id])

    return (
        <FlowNodeCard selected={selected} color="violet" className="w-64 bg-[#241a36]">
            <InputHandle color="violet" />

            <NodeHeader icon={<Workflow className="size-4" />} title={savedNode.name} color="violet" />

            <p className="px-3 pb-3 text-xs text-violet-300/75">Run subflow</p>

            <TransitionEditor node={savedNode} onUpdate={update} color="violet" excludedTransitionTypes={["else", "always"]} />
        </FlowNodeCard>
    )
}
