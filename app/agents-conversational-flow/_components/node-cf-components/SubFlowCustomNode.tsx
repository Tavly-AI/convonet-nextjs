import type { NodeProps } from "@xyflow/react"
import { Workflow } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { TransitionEditor } from "./TransitionEditor"
import { useActiveFlowNode } from "./use-active-flow-node"

export function SubFlowCustomNode({ id, data: node, selected }: NodeProps<CF["Nodes"]["subflow"]>) {
    const [savedNode, update] = useActiveFlowNode("subflow", id, node)

    return (
        <FlowNodeCard selected={selected} color="violet" className="w-64 bg-[#241a36]">
            <InputHandle color="violet" />

            <NodeHeader icon={<Workflow className="size-4" />} title={savedNode.name} color="violet" />

            <p className="px-3 pb-3 text-xs text-violet-300/75">Run subflow</p>

            <TransitionEditor node={savedNode} onUpdate={update} color="violet" excludedTransitionTypes={["else", "always"]} />
        </FlowNodeCard>
    )
}
