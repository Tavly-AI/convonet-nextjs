import type { NodeProps } from "@xyflow/react"
import { PhoneOff } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { useActiveFlowNode } from "./use-active-flow-node"

export function EndFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["end"]>) {
    const [savedNode, update] = useActiveFlowNode("end", id, data)

    return (
        <FlowNodeCard selected={selected} color="teal" className="bg-[#153331]">
            <InputHandle color="teal" />
            <NodeHeader icon={<PhoneOff className="size-4" />} title={savedNode.name} color="teal" />
            <div className="mx-1 rounded-xl bg-[#121216]">
                <div className="nodrag flex items-center gap-1 px-3 pt-2">
                    <button
                        type="button"
                        onClick={() => update(node => ({ ...node, instruction: { ...node.instruction, type: "prompt" } }))}
                        className={savedNode.instruction.type === "prompt" ? "rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200" : "rounded-md px-2 py-1 text-xs text-zinc-400"}
                    >
                        Prompt
                    </button>
                    <button
                        type="button"
                        onClick={() => update(node => ({ ...node, instruction: { ...node.instruction, type: "static_text" } }))}
                        className={savedNode.instruction.type === "static_text" ? "rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200" : "rounded-md px-2 py-1 text-xs text-zinc-400"}
                    >
                        Static Sentence
                    </button>
                </div>
                <textarea
                    value={savedNode.instruction.text}
                    onChange={event => update(node => ({
                        ...node,
                        instruction: { ...node.instruction, text: event.target.value },
                    }))}
                    placeholder="End the call"
                    className="nodrag nowheel h-28 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
            </div>
        </FlowNodeCard>
    )
}
