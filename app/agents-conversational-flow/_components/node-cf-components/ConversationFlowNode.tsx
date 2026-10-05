import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { MessageSquareText } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { conversational_flow_session_storage } from "../../_lib/flow-sessionStorage"
import { TransitionEditor } from "./TransitionEditor"

type ConversationNodeProps = Pick<NodeProps<CF["Nodes"]["conversation"]>, "id" | "data" | "selected">

export function FlowConversationNodeType({ id, data: node, selected }: ConversationNodeProps) {
    const [savedNode, setSavedNode] = useState(() => conversational_flow_session_storage.get("conversation", id) ?? node)
    const update = (fn: (node: CF["Data"]["conversation"]) => CF["Data"]["conversation"]) => conversational_flow_session_storage.update("conversation", id, fn)

    useEffect(() => conversational_flow_session_storage.subscribe(() => {
        const updatedNode = conversational_flow_session_storage.get("conversation", id)
        if (updatedNode) setSavedNode(updatedNode)
    }), [id])

    return (
        <FlowNodeCard selected={selected} color="pink" className="w-[350px] bg-[#452733]">
            <InputHandle color="pink" top={29} />
            <NodeHeader icon={<MessageSquareText className="size-5" />} title={savedNode.name} color="pink" className="h-12 px-4 text-base" />

            <div className="px-1">
                <div className="rounded-xl bg-[#1c1c21]">
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
                        onChange={e => update(node => ({
                            ...node,
                            instruction: { ...node.instruction, text: e.target.value },
                        }))}
                        placeholder="Type {{ to add dynamic variables."
                        className="nodrag nowheel h-32 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                    />
                </div>
            </div>

            <TransitionEditor node={savedNode} onUpdate={update} color="pink" />
        </FlowNodeCard>
    )
}
