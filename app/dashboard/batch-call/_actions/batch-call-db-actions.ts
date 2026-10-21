"use server"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { batchCallCreateSchema, type BatchCallGlobalType } from "../_lib/batch-call-global-types"

export async function batchCall_DB_create(input: BatchCallGlobalType["request"]): Promise<BatchCallGlobalType["response"]> {

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
        name: batch.name ?? "",
        fromPhoneNumberId: batch.fromPhoneNumberId,
        total_task_count: batch._count.tasks,
    }
}
