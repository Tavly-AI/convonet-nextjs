import type { NodeProps } from "@xyflow/react"
import { GitBranch, Plus } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function LogicSplitFlowNode({ data, selected }: NodeProps<CF["Nodes"]["branch"]>) {
    return (
        <FlowNodeCard selected={selected} color="blue" className="bg-[#182443]">
            <InputHandle color="blue" />
            <NodeHeader icon={<GitBranch className="size-4" />} title={data.name} color="blue" />
            <div className="flex items-center justify-between px-3 pb-3 text-sm font-medium text-blue-400">
                Transition <Plus className="size-4" />
            </div>
            {data.edges.map((edge) => <EdgeRow key={edge.id} edge={edge} color="blue" />)}
            <EdgeRow edge={data.else_edge} color="blue" label="Else" />
        </FlowNodeCard>
    )
}
