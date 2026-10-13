import type { NodeProps } from "@xyflow/react"
import { MessageSquareText } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { useActiveFlowNode } from "./use-active-flow-node"

export function SmsFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["sms"]>) {
    const [savedNode, update] = useActiveFlowNode("sms", id, data)

    return (
        <FlowNodeCard selected={selected} color="yellow" className="bg-[#332e12]">
            <InputHandle color="yellow" />
            <NodeHeader icon={<MessageSquareText className="size-4" />} title={savedNode.name} color="yellow" />
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
                    placeholder="Type {{ to add dynamic variables."
                    className="nodrag nowheel h-28 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
            </div>
            <p className="px-3 py-3 text-sm font-medium text-yellow-400">Transition</p>
            <EdgeRow edge={savedNode.success_edge} color="yellow" label="Sent successfully" />
            <EdgeRow edge={savedNode.failed_edge} color="yellow" label="Failed to send" />
        </FlowNodeCard>
    )
}
