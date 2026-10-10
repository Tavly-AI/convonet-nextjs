import type { NodeProps } from "@xyflow/react"
import { LogOut } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function SubflowEndNode({ data, selected }: NodeProps<CF["Nodes"]["subflow_end"]>) {
    return (
        <FlowNodeCard selected={selected} color="teal" className="bg-[#153331]">
            <InputHandle color="teal" />

            <NodeHeader
                icon={<LogOut className="size-4" />}
                title={data.name}
                color="teal"
            />

            <p className="px-3 py-3 text-xs text-teal-400">
                Return to main flow
            </p>
        </FlowNodeCard>
    )
}