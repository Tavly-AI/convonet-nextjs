import type { NodeProps } from "@xyflow/react"
import { Code2, Plus } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function CodeFlowNode({ data, selected }: NodeProps<CF["Nodes"]["code"]>) {
    return (
        <FlowNodeCard selected={selected} color="zinc" className="bg-[#28282b]">
            <InputHandle color="zinc" />
            <NodeHeader icon={<Code2 className="size-4" />} title={data.name} color="zinc" />
            <div className="mx-1 flex items-center justify-between rounded-xl bg-[#121216] px-3 py-3 text-sm text-zinc-400">
                <span>Configure Code</span>
                <span className="rounded-md border border-zinc-700 px-2 py-0.5 text-xs">Open</span>
            </div>
            <div className="flex items-center justify-between px-3 py-3 text-sm font-medium text-zinc-400">
                Transition
                <Plus className="size-4" />
            </div>
            {data.edges?.map((edge) => (
                <EdgeRow key={edge.id} edge={edge} color="zinc" />
            ))}
            <EdgeRow edge={data.else_edge} color="zinc" label="Else" />
        </FlowNodeCard>
    )
}
