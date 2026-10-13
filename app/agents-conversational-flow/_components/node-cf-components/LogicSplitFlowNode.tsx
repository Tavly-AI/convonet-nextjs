import type { NodeProps } from "@xyflow/react"
import { GitBranch } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { TransitionEditor } from "./TransitionEditor"
import { useActiveFlowNode } from "./use-active-flow-node"

export function LogicSplitFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["branch"]>) {
    const [savedNode, update] = useActiveFlowNode("branch", id, data)

    return (
        <FlowNodeCard selected={selected} color="blue" className="bg-[#182443]">
            <InputHandle color="blue" />
            <NodeHeader icon={<GitBranch className="size-4" />} title={savedNode.name} color="blue" />
            <TransitionEditor node={savedNode} onUpdate={update} color="blue" excludedTransitionTypes={["else", "always"]} />
        </FlowNodeCard>
    )
}
