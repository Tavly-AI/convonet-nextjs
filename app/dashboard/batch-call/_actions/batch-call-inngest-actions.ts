import { Inngest } from "inngest"
import { prisma } from "@/lib/prisma"
import type { BatchCallGlobalType } from "../_lib/batch-call-global-types"
import { startOutboundTestCall } from "../../phone-numbers/_lib/outbound-call-actions"
import { BATCH_CALL_CONCURRENCY, BATCH_CALL_MAX_CPS, batchCallGetWorkspaceOngoingCallCount } from "../_lib/batch-call-pipeline-functions"

export const batchCallInngestClient = new Inngest({
    id: "batch-call-16oct26",
})

export const batchCallInngestProcess = batchCallInngestClient.createFunction(
    {
        id: "batch-call-process-16oct26",
        retries: 3,
        triggers: [{ event: "batch-call/created-16oct26" }],
    },
    async ({ event, step }) => {
        const { batchCallId, workspaceId } = event.data

        const batchCallData = await prisma.batchCall.findFirst({
            where: {
                id: batchCallId,
                workspaceId,
            },
            include: {
                tasks: {
                    where: {
                        workerTaskStatus: "pending" satisfies BatchCallGlobalType["workerTaskStatus"],
                    },
                },
            },
        })

        if (!batchCallData) { throw new Error("Batch call not found") }

        for (const task of batchCallData.tasks) {

            let attempt = 0
            while (true) {
                const ongoingCalls = await step.run(`check-concurrency-${task.id}-${attempt}`, () => batchCallGetWorkspaceOngoingCallCount(workspaceId))
                if (ongoingCalls < BATCH_CALL_CONCURRENCY) break
                await step.sleep(`wait-for-slot-${task.id}-${attempt}`, "5s")
                attempt++
            }

            await step.run(`call-${task.id}`, async () => {
                const result = await startOutboundTestCall({
                    phoneNumberId: batchCallData.fromPhoneNumberId,
                    destinationNumber: task.to_number,
                    workspaceId: batchCallData.workspaceId
                })
                await prisma.batchCallTask.update({
                    where: { id: task.id },
                    data: { workerTaskStatus: "completed" satisfies BatchCallGlobalType["workerTaskStatus"] },
                })
                return result
            })

            await step.sleep(`cps-wait-${task.id}`, `${Math.ceil(1000 / BATCH_CALL_MAX_CPS)}ms`,)
        }

        return {
            batchCallId,
            totalTasks: batchCallData.tasks.length,
            status: "completed",
        }
    }
)
