import type { NodeProps } from "@xyflow/react"
import { Code2 } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { TransitionEditor } from "./TransitionEditor"
import { useActiveFlowNode } from "./use-active-flow-node"

export function CodeFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["code"]>) {
    const [savedNode, update] = useActiveFlowNode("code", id, data)

    return (
        <FlowNodeCard selected={selected} color="zinc" className="bg-[#28282b]">
            <InputHandle color="zinc" />
            <NodeHeader icon={<Code2 className="size-4" />} title={savedNode.name} color="zinc" />
            <div className="mx-1 flex items-center justify-between rounded-xl bg-[#121216] px-3 py-3 text-sm text-zinc-400">
                <span>Configure Code</span>
                <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs">Open</span>
            </div>
            <TransitionEditor node={savedNode} onUpdate={update} color="zinc" excludedTransitionTypes={["else", "always"]} />
        </FlowNodeCard>
    )
}
