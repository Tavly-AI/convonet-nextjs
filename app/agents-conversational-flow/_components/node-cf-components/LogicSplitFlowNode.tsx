import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { GitBranch } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { getFlowNodeData, subscribeToFlowNodeData, updateFlowNodeData } from "../../_lib/flow-sessionStorage"
import { TransitionEditor } from "./TransitionEditor"

export function LogicSplitFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["branch"]>) {
    const [savedNode, setSavedNode] = useState(() => getFlowNodeData("branch", id) ?? data)
    const update = (fn: (node: CF["Data"]["branch"]) => CF["Data"]["branch"]) => updateFlowNodeData("branch", id, fn)

    useEffect(() => subscribeToFlowNodeData(() => {
        const updatedNode = getFlowNodeData("branch", id)
        if (updatedNode) setSavedNode(updatedNode)
    }), [id])

    return (
        <FlowNodeCard selected={selected} color="blue" className="bg-[#182443]">
            <InputHandle color="blue" />
            <NodeHeader icon={<GitBranch className="size-4" />} title={savedNode.name} color="blue" />
            <TransitionEditor node={savedNode} onUpdate={update} color="blue" excludedTransitionTypes={["else", "always"]} />
        </FlowNodeCard>
    )
}
