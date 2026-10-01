import type { NodeProps } from "@xyflow/react"
import { MoreHorizontal, PhoneCall } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function CallTransferFlowNode({ data, selected }: NodeProps<CF["Nodes"]["transfer_call"]>) {
    return (
        <FlowNodeCard selected={selected} color="yellow" className="bg-[#332e12]">
            <InputHandle color="yellow" top={24} />
            <NodeHeader
                icon={<PhoneCall className="size-4" />}
                title={data.name}
                color="yellow"
                actions={<button type="button" className="nodrag text-zinc-500 hover:text-zinc-200"><MoreHorizontal className="size-4" /></button>}
            />

            {/* Transition */}
            <div className="px-3 pb-2 pt-1">
                <span className="text-xs font-medium text-yellow-400">
                    Transition
                </span>
            </div>

            <EdgeRow edge={data.edge} color="yellow" />
        </FlowNodeCard>
    )
}
