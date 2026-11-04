import type { AgentSessionAgent } from "@/app/agents/_lib/session-storage/agent-session"
import type { CallRecordDatabaseData, LiveKitSessionReportPayload } from "@/app/api/livekit/sessionReport/types"

export type BillingGlobalTypes = {

    PostServiceInput: {
        body: LiveKitSessionReportPayload
        agent: {
            workspaceId: string
            channel: AgentSessionAgent["channel"]
            config: AgentSessionAgent["config"]
            llmConfig: AgentSessionAgent["llmConfig"]
        }
        durationMs: number
    }

    CallCost: NonNullable<CallRecordDatabaseData["call_cost"]>

    ChargeCallInput: {
        workspaceId: string
        callId: string
        amount: number
        callCost: BillingGlobalTypes["CallCost"]
    }
}