import { useEffect, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { Hash } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"
import { conversational_flow_session_storage } from "../../_lib/flow-sessionStorage"
import { TransitionEditor } from "./TransitionEditor"

export function PressDigitFlowNode({ id, data, selected }: NodeProps<CF["Nodes"]["press_digit"]>) {
    const [savedNode, setSavedNode] = useState(() => conversational_flow_session_storage.get("press_digit", id) ?? data)
    const update = (fn: (node: CF["Data"]["press_digit"]) => CF["Data"]["press_digit"]) => conversational_flow_session_storage.update("press_digit", id, fn)

    useEffect(() => conversational_flow_session_storage.subscribe(() => {
        const updatedNode = conversational_flow_session_storage.get("press_digit", id)
        if (updatedNode) setSavedNode(updatedNode)
    }), [id])

    return (
        <FlowNodeCard selected={selected} color="cyan" className="bg-[#183038]">
            <InputHandle color="cyan" />
            <NodeHeader icon={<Hash className="size-4" />} title={savedNode.name} color="cyan" />
            <div className="mx-1 rounded-xl bg-[#121216] p-3 text-sm text-zinc-300">
                <p className="mb-2 text-xs text-cyan-400">IVR navigation instructions</p>
                <p className="min-h-12 whitespace-pre-wrap text-zinc-400">{savedNode.instruction.text || "Describe which IVR option to choose."}</p>
                <p className="mt-2 text-xs text-zinc-500">Delay: {savedNode.delay_ms}ms</p>
            </div>
            <TransitionEditor node={savedNode} onUpdate={update} color="cyan" excludedTransitionTypes={["always"]} />
        </FlowNodeCard>
    )
}
