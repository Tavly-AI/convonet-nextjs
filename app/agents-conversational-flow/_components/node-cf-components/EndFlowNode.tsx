import type { NodeProps } from "@xyflow/react"
import { PhoneOff } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function EndFlowNode({ data, selected }: NodeProps<CF["Nodes"]["end"]>) {
    return (
        <FlowNodeCard selected={selected} color="teal" className="bg-[#153331]">
            <InputHandle color="teal" />
            <NodeHeader icon={<PhoneOff className="size-4" />} title={data.name} color="teal" />
            <div className="mx-1 min-h-28 rounded-xl bg-[#121216] p-3 text-sm text-zinc-300">
                {data.instruction.text || "End the call"}
            </div>
        </FlowNodeCard>
    )
}
