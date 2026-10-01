import type { NodeProps } from "@xyflow/react"
import { MessageSquareText } from "lucide-react"

import type { CF } from "../../_types/global-cf-types"
import { EdgeRow, FlowNodeCard, InputHandle, NodeHeader } from "./FlowNodePrimitives"

export function SmsFlowNode({ data, selected }: NodeProps<CF["Nodes"]["sms"]>) {
    return (
        <FlowNodeCard selected={selected} color="yellow" className="bg-[#332e12]">
            <InputHandle color="yellow" />
            <NodeHeader icon={<MessageSquareText className="size-4" />} title={data.name} color="yellow" />
            <div className="mx-1 min-h-28 rounded-xl bg-[#121216] p-3 text-sm text-zinc-400">
                {data.instruction.text || "Type {{ to add dynamic variables."}
            </div>
            <p className="px-3 py-3 text-sm font-medium text-yellow-400">Transition</p>
            <EdgeRow edge={data.success_edge} color="yellow" label="Sent successfully" />
            <EdgeRow edge={data.failed_edge} color="yellow" label="Failed to send" />
        </FlowNodeCard>
    )
}
