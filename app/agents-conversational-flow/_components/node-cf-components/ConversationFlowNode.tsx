import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { MessageSquareText, Plus } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { getFlowNodeData, subscribeToFlowNodeData, updateFlowNodeData } from "../../_lib/flow-sessionStorage"

type ConversationNodeProps = Pick<NodeProps<CF["Nodes"]["conversation"]>, "id" | "selected">

export function FlowConversationNodeType({ id, selected }: ConversationNodeProps) {
    const [node, setNode] = useState(() => getFlowNodeData("conversation", id))
    const update = (fn: (node: CF["Data"]["conversation"]) => CF["Data"]["conversation"]) => updateFlowNodeData("conversation", id, fn)

    useEffect(() => subscribeToFlowNodeData(() =>
        setNode(getFlowNodeData("conversation", id))
    ), [id])

    if (!node) return null

    return (
        <FlowNodeCard selected={selected} color="pink" className="w-[350px] bg-[#452733]">
            <InputHandle color="pink" top={29} />
            <NodeHeader icon={<MessageSquareText className="size-5" />} title={node.name} color="pink" className="h-12 px-4 text-base" />

            <div className="px-1">
                <div className="rounded-xl bg-[#1c1c21]">
                    <div className="nodrag flex items-center gap-1 px-3 pt-2">
                        <button
                            type="button"
                            onClick={() => update(node => ({ ...node, instruction: { ...node.instruction, type: "prompt" } }))}
                            className={node.instruction.type === "prompt" ? "rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200" : "rounded-md px-2 py-1 text-xs text-zinc-400"}
                        >
                            Prompt
                        </button>

                        <button
                            type="button"
                            onClick={() => update(node => ({ ...node, instruction: { ...node.instruction, type: "static_text" } }))}
                            className={node.instruction.type === "static_text" ? "rounded-md bg-zinc-700 px-2.5 py-1 text-xs text-zinc-200" : "rounded-md px-2 py-1 text-xs text-zinc-400"}
                        >
                            Static Sentence
                        </button>
                    </div>

                    <textarea
                        value={node.instruction.text}
                        onChange={e => update(node => ({
                            ...node,
                            instruction: { ...node.instruction, text: e.target.value },
                        }))}
                        placeholder="Type {{ to add dynamic variables."
                        className="nodrag nowheel h-32 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <span className="text-sm font-medium text-pink-400">
                    Transition
                </span>

                <button
                    type="button"
                    onClick={() => update(node => ({
                        ...node,
                        edges: [...(node.edges ?? []), {
                            id: crypto.randomUUID(),
                            transition_condition: {
                                type: "prompt",
                                prompt: "Describe the transition condition",
                            },
                        }],
                    }))}
                    className="nodrag text-zinc-400 hover:text-white"
                >
                    <Plus className="size-4" />
                </button>
            </div>

            {node.edges?.map((edge) => (
                <EdgeRow
                    key={edge.id}
                    edge={edge}
                    color="pink"
                    label={edge.transition_condition.prompt ?? "Describe the transition condition"}
                    onLabelChange={prompt => update(node => ({
                        ...node,
                        edges: node.edges?.map(e => e.id === edge.id
                            ? { ...e, transition_condition: { type: "prompt", prompt } }
                            : e),
                    }))}
                />
            ))}
        </FlowNodeCard>
    )
}
