import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { Bot, MoreHorizontal, Pencil, Plus } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { getFlowNodeData, subscribeToFlowNodeData, updateFlowNodeData } from "../../_lib/flow-sessionStorage"
import { TransitionEditor } from "./TransitionEditor"

export function FlowSubAgentsNodeType({ id, data, selected }: NodeProps<CF["Nodes"]["subagent"]>) {
    const [savedNode, setSavedNode] = useState(() => getFlowNodeData("subagent", id) ?? data)
    const update = (fn: (node: CF["Data"]["subagent"]) => CF["Data"]["subagent"]) => updateFlowNodeData("subagent", id, fn)

    useEffect(() => subscribeToFlowNodeData(() => {
        const updatedNode = getFlowNodeData("subagent", id)
        if (updatedNode) setSavedNode(updatedNode)
    }), [id])
    return (
        <FlowNodeCard selected={selected} color="green" className="w-[480px] bg-[#172318] transition-colors">
            <InputHandle color="green" top={28} />

            <NodeHeader
                icon={<Bot className="size-5" />}
                title={savedNode.name}
                color="green"
                className="h-12 px-4"
                titleClassName="text-base"
                titleSuffix={<button type="button" className="nodrag text-green-400/70 transition-colors hover:text-green-300"><Pencil className="size-3.5" /></button>}
                actions={<button type="button" className="nodrag text-zinc-500 transition-colors hover:text-zinc-200"><MoreHorizontal className="size-5" /></button>}
            />

            {/* Subagent instruction */}
            <div className="px-1">
                <div className="rounded-xl bg-[#1c1c21]">
                    <div className="nodrag flex items-center justify-between px-3 pt-3">
                        <span className="rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-300">
                            Prompt
                        </span>
                        <span className="text-xs text-zinc-500">
                            {savedNode.skippable ? "Optional" : "Required"}
                        </span>
                    </div>
                    <textarea
                        value={savedNode.instruction.text}
                        onChange={event => update(node => ({
                            ...node,
                            instruction: { ...node.instruction, text: event.target.value },
                        }))}
                        placeholder="Define the steps and tasks for this subagent. Type / to add functions and {{ to insert dynamic variables."
                        className="nodrag nowheel h-32 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-4">
                <span className="text-sm font-medium text-green-400">
                    Node Functions
                </span>

                <button
                    type="button"
                    className="nodrag text-green-400/70 transition-colors hover:text-green-300"
                >
                    <Plus className="size-4" />
                </button>
            </div>

            <TransitionEditor node={savedNode} onUpdate={update} color="green" />
        </FlowNodeCard>
    )
}
