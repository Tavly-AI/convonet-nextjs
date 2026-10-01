import type { NodeProps } from "@xyflow/react"
import { Network } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function AgentTransferFlowNode({ data, selected }: NodeProps<CF["Nodes"]["agent_swap"]>) {
    return (
        <FlowNodeCard selected={selected} color="orange" className="bg-[#3a2918]">
            <InputHandle color="orange" />
            <NodeHeader icon={<Network className="size-4" />} title={data.name} color="orange" />
            <div className="mx-1 rounded-xl bg-[#121216] p-3 text-sm text-zinc-400">
                <p className="text-xs text-orange-400">Transfer agent</p>
                <p className="mt-2 truncate">{data.agent_id || "Select an agent"}</p>
                <p className="mt-1 text-xs text-zinc-500">Version {data.agent_version}</p>
            </div>
            <p className="px-3 py-3 text-sm font-medium text-orange-400">Transition</p>
            <EdgeRow edge={data.edge} color="orange" label="Transfer failed" />
        </FlowNodeCard>
    )
}
