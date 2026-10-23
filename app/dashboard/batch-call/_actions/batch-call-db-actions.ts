"use server"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { BATCH_CALL_TOTAL_CONCURRENCY, batchCallCreateSchema, type BatchCallGlobalType } from "../_lib/batch-call-global-types"

export async function batchCall_DB_list() {
    const workspaceId = await getCurrentWorkspaceId()
    const batches = await prisma.batchCall.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            createdAt: true,
            trigger_timestamp: true,
            fromPhoneNumber: { select: { phoneNumber: true } },
            tasks: { select: { workerTaskStatus: true } },
        },
    })
    return { batches, now: Date.now() }
}


export async function batchCall_DB_create(input: BatchCallGlobalType["request"]): Promise<BatchCallGlobalType["response"] & { workspaceId: string }> {

    const parsed = batchCallCreateSchema.parse(input)
    const workspaceId = await getCurrentWorkspaceId()

    const phoneNumber = await prisma.phoneNumber.findFirst({
        where: {
            workspaceId,
            id: parsed.fromPhoneNumberId,
        },
    })

    if (!phoneNumber) { throw new Error("Outbound phone number not found") }

    const batch = await prisma.batchCall.create({
        data: {
            workspaceId,
            name: parsed.name,
            reserved_concurrency: parsed.reserved_concurrency ?? 1,
            call_time_window: parsed.call_time_window,
            trigger_timestamp: BigInt(parsed.trigger_timestamp ?? Date.now() + 60_000),
            fromPhoneNumberId: phoneNumber.id,
            tasks: {
                create: parsed.tasks.map(task => ({
                    to_number: task.to_number,
                    llm_dynamic_variables: task.llm_dynamic_variables,
                })),
            },
        },
        include: {
            _count: {
                select: { tasks: true },
            },
        },
    })

    revalidatePath("/dashboard/batch-call")

    return {
        batch_call_id: batch.id,
        workspaceId,
        name: batch.name ?? "",
        fromPhoneNumberId: batch.fromPhoneNumberId,
        total_task_count: batch._count.tasks,
        scheduled_timestamp: batch.trigger_timestamp === null ? undefined : Number(batch.trigger_timestamp),
    }
}


export async function batchCallGetTriggerTimestamp(batchCallId: string, workspaceId: string): Promise<number | null> {

    const batch = await prisma.batchCall.findFirst({
        where: { id: batchCallId, workspaceId },
        select: { trigger_timestamp: true },
    })

    if (!batch) throw new Error("Batch not found")

    return batch.trigger_timestamp === null ? null : Number(batch.trigger_timestamp)
}


export async function batchCall_DB_getAvailableWorkSpaceConnuruncy() {
    const workspaceId = await getCurrentWorkspaceId()
    const reserved = await prisma.batchCall.aggregate({
        where: { workspaceId, tasks: { some: { workerTaskStatus: { notIn: ["completed", "failed"] } } } },
        _sum: { reserved_concurrency: true },
    })
    return Math.max(0, BATCH_CALL_TOTAL_CONCURRENCY - (reserved._sum.reserved_concurrency ?? 0))
}