import type { NodeProps } from "@xyflow/react"
import { StickyNote } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, NodeHeader } from "./FlowNodePrimitives"
import { useActiveFlowNode } from "./use-active-flow-node"

export function NoteFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["note"]>) {
    const [savedNode, update] = useActiveFlowNode("note", id, data)

    return (
        <FlowNodeCard selected={selected} color="yellow">
            <NodeHeader icon={<StickyNote className="size-4" />} title={savedNode.name} color="yellow" />
            <div className="mx-1 rounded-xl bg-[#121216]">
                <textarea
                    aria-label="Note instructions"
                    value={savedNode.instruction.text}
                    onChange={event => update(node => ({
                        ...node,
                        instruction: { ...node.instruction, text: event.target.value },
                    }))}
                    placeholder="Write a note..."
                    className="nodrag nowheel h-28 w-full resize-none bg-transparent px-3 py-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                />
            </div>
        </FlowNodeCard>
    )
}
