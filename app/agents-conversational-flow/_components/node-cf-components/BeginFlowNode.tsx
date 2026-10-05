import { Handle, type NodeProps, Position } from "@xyflow/react"
import { CircleDot } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"

export function FlowBeginNodeType({ data, selected }: NodeProps<CF["Nodes"]["begin"]>) {
    return (
        <div className={`w-56 rounded-xl border bg-zinc-950 p-3 shadow-2xl ${selected ? "border-violet-400 ring-2 ring-violet-500/30" : "border-zinc-700"}`}>
            <div className="flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-md bg-violet-500 text-white">
                    <CircleDot className="size-3.5" />
                </span>

                <span className="text-sm font-semibold text-zinc-100">
                    {data.name}
                </span>
            </div>

            <Handle id={data.edge.id} type="source" position={Position.Right} className="!size-3 !border-2 !border-zinc-950 !bg-violet-400" />
        </div >
    )
}
