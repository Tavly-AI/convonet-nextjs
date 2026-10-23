import { INTERNATION_PHONE_NUMBER_SCHEMA } from "@/lib/constants"
import { z } from "zod"

export const BATCH_CALL_TOTAL_CONCURRENCY = 5
export const BATCH_CALL_MAX_CPS = 1

export type BatchCallGlobalType = {
    workerTaskStatus: "pending" | "processing" | "completed" | "failed"
    request: {
        name?: string
        fromPhoneNumberId: string
        tasks: BatchCallGlobalType["task"][]
        trigger_timestamp?: number
        reserved_concurrency?: number
        call_time_window?: BatchCallGlobalType["timeWindow"]
    }
    response: {
        batch_call_id: string
        name: string
        fromPhoneNumberId: string
        total_task_count: number
        scheduled_timestamp?: number
        call_time_window?: BatchCallGlobalType["timeWindow"]
    }
    task: {
        to_number: string
        llm_dynamic_variables?: Record<string, string>
        metadata?: unknown
        override_agent_id?: string
        override_agent_version?: string | number
        custom_sip_headers?: Record<string, string>
        ignore_e164_validation?: boolean
    }
    timeWindow?: {
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

export const batchCallCreateSchema = z.object({
    name: z.string().trim().max(120).optional(),
    fromPhoneNumberId: z.string().trim().min(1, "Select an outbound phone number"),
    tasks: z.array(z.object({
        to_number: INTERNATION_PHONE_NUMBER_SCHEMA,
        llm_dynamic_variables: z.record(z.string(), z.string()).optional(),
        metadata: z.unknown().optional(),
        override_agent_id: z.string().optional(),
        override_agent_version: z.union([z.string(), z.number()]).optional(),
        custom_sip_headers: z.record(z.string(), z.string()).optional(),
        ignore_e164_validation: z.boolean().optional(),
    })).min(1, "Add at least one recipient").max(1000, "Upload at most 1,000 recipients"),
    trigger_timestamp: z.number().int().nonnegative().optional(),
    reserved_concurrency: z.number().int().min(1).max(BATCH_CALL_TOTAL_CONCURRENCY).optional(),
    call_time_window: z.object({
        windows: z.array(z.object({
            start: z.number().int().min(0).max(1439),
            end: z.number().int().min(0).max(1439),
        })),
        timezone: z.string().optional(),
        day: z.array(z.enum([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ])).optional(),
    }).optional(),
}) satisfies z.ZodType<BatchCallGlobalType["request"]>
