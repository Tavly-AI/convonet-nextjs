import type { NodeProps } from "@xyflow/react"
import { Hash, Plus } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function PressDigitFlowNode({ data, selected }: NodeProps<CF["Nodes"]["press_digit"]>) {
    return (
        <FlowNodeCard selected={selected} color="cyan" className="bg-[#183038]">
            <InputHandle color="cyan" />
            <NodeHeader icon={<Hash className="size-4" />} title={data.name} color="cyan" />
            <div className="mx-1 rounded-xl bg-[#121216] p-3 text-sm text-zinc-300">
                <p className="mb-2 text-xs text-cyan-400">IVR navigation instructions</p>
                <p className="min-h-12 whitespace-pre-wrap text-zinc-400">{data.instruction.text || "Describe which IVR option to choose."}</p>
                <p className="mt-2 text-xs text-zinc-500">Delay: {data.delay_ms}ms</p>
            </div>
            <div className="flex items-center justify-between px-3 py-3 text-sm font-medium text-cyan-400">
                Transition <Plus className="size-4" />
            </div>
            {data.edges?.map((edge) => <EdgeRow key={edge.id} edge={edge} color="cyan" />)}
        </FlowNodeCard>
    )
}
