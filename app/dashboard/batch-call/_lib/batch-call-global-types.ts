export type BatchCallGlobalType = {
    request: {
        name?: string
        from_number: string
        tasks: BatchCallGlobalType["task"][]
        trigger_timestamp?: number // ms | omit for send_now
        reserved_concurrency?: number
        call_time_window?: BatchCallGlobalType["timeWindow"]
    }
    response: {
        batch_call_id: string
        name: string
        from_number: string
        scheduled_timestamp: number
        total_task_count: number
        call_time_window?: BatchCallGlobalType["timeWindow"]
    }
    task: {
        to_number: string
        retell_llm_dynamic_variables?: Record<string, string>
        metadata?: unknown
        override_agent_id?: string
        override_agent_version?: string | number
        custom_sip_headers?: Record<string, string>
        ignore_e164_validation?: boolean
    }
    timeWindow: {
        /** Minutes since local midnight. Windows cannot cross midnight. */
        windows: { start: number; end: number }[]
        timezone?: string
        day?: (
            | "Monday"
            | "Tuesday"
            | "Wednesday"
            | "Thursday"
            | "Friday"
            | "Saturday"
            | "Sunday"
        )[]
    }
}
