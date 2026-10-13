import type { NodeProps } from "@xyflow/react"
import { Braces } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { TransitionEditor } from "./TransitionEditor"
import { useActiveFlowNode } from "./use-active-flow-node"

export function CustomFunctionFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["function"]>) {
    const [savedNode, update] = useActiveFlowNode("function", id, data)

    return (
        <FlowNodeCard selected={selected} color="purple">
            <InputHandle color="purple" />
            <NodeHeader icon={<Braces className="size-4" />} title={savedNode.name} color="purple" />
            <div className="mx-1 flex items-center justify-between rounded-xl bg-[#121216] px-3 py-3 text-sm text-zinc-400">
                <span>Configure Custom Function</span>
                <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs">Open</span>
            </div>
            <TransitionEditor node={savedNode} onUpdate={update} color="purple" excludedTransitionTypes={["always"]} />
        </FlowNodeCard>
    )
}
