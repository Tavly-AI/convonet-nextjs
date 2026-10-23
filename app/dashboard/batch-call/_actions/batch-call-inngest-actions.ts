import { BATCH_CALL_INNGEST_CONSTANTS } from "../_lib/batch-call-inngest-constants"
import { Inngest } from "inngest"
import { prisma } from "@/lib/prisma"
import { BATCH_CALL_MAX_CPS, type BatchCallGlobalType } from "../_lib/batch-call-global-types"
import { startOutboundTestCall } from "../../phone-numbers/_lib/outbound-call-actions"
import { batchCallGetWorkspaceCurrentBatchOngoingCallCount } from "../_lib/batch-call-pipeline-functions"
import { batchCallGetTriggerTimestamp } from "./batch-call-db-actions"
import { DateTime } from "luxon"

export const batchCallInngestClient = new Inngest({
    id: BATCH_CALL_INNGEST_CONSTANTS.app.clientId,
})

export const batchCallInngestProcess = batchCallInngestClient.createFunction(
    {
        id: BATCH_CALL_INNGEST_CONSTANTS.functions.scheduler,
        retries: 3,
        triggers: [{ event: BATCH_CALL_INNGEST_CONSTANTS.events.batchCreated }],
    },
    async ({ event, step }) => {

        // ===============================================================
        // =================== GET DATA FROM PARAMS  =====================
        // ===============================================================

        const { batchCallId, workspaceId } = event.data

        // ===============================================================
        // =================== RESOLVE TIMESTAMPZS =======================
        // ===============================================================

        const triggerTimestamp = await step.run(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.scheduling.getBatch, () => batchCallGetTriggerTimestamp(batchCallId, workspaceId))
        if (triggerTimestamp !== null) { await step.sleepUntil(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.scheduling.waitUntilScheduled, new Date(triggerTimestamp)) }


        // ===============================================================
        // =================== GET BATCH DATA FROM DB ====================
        // ===============================================================

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

        // ===============================================================
        // =================== RUN LONG RUNNING TASK =====================
        // ===============================================================


        for (const task of batchCallData.tasks) {

            // ===============================================================
            // =================== RESOLVE CALL TIME WINDOW ==================
            // ===============================================================


            if (!batchCallIsWithinTimeWindow(batchCallData.call_time_window as BatchCallGlobalType["timeWindow"])) {
                const rerun = await step.run(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.scheduling.checkBatchRerun(task.id), () => batchCallTriggerInngestServerForRerun(batchCallId, workspaceId, batchCallData.call_time_window as BatchCallGlobalType["timeWindow"]))
                if (!rerun) break
                await step.sleepUntil(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.scheduling.waitNextWindow(task.id), new Date(rerun.nextTimestamp))
            }

            // ===============================================================
            // =================== RESOLVE CONNCURRENCY  =====================
            // ===============================================================

            let attempt = 0
            while (true) {
                const ongoingCalls = await step.run(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.concurrency.check(task.id, attempt), () => batchCallGetWorkspaceCurrentBatchOngoingCallCount(workspaceId, batchCallId))
                if (ongoingCalls < Math.max(1, batchCallData.reserved_concurrency)) break
                await step.sleep(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.concurrency.waitForSlot(task.id, attempt), "40s")
                attempt++
            }

            // ===============================================================
            // =================== INITIATE OUTBOUND CALL ====================
            // ===============================================================

            await step.run(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.task.processing(task.id), () => batchCallTaskUpdateWorkerStatus(task.id).processing())

            await step.sendEvent(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.task.dispatch(task.id), {
                name: BATCH_CALL_INNGEST_CONSTANTS.events.callDispatch,
                data: {
                    batchCallId,
                    taskId: task.id,
                    workspaceId,
                    phoneNumberId: batchCallData.fromPhoneNumberId,
                    destinationNumber: task.to_number,
                },
            })

            // ===============================================================
            // =================== RESOLVE CALL PER SEC ======================
            // ===============================================================

            await step.sleep(BATCH_CALL_INNGEST_CONSTANTS.steps.scheduler.task.cpsWait(task.id), `${Math.ceil(1000 / BATCH_CALL_MAX_CPS)}ms`,)
        }

        return { batchCallId, totalTasks: batchCallData.tasks.length, status: "completed" }
    }
)

// ===============================================================
// =================== UPDATE WORKER STATUS ======================
// ===============================================================

function batchCallTaskUpdateWorkerStatus(id: string) {
    const update = (workerTaskStatus: BatchCallGlobalType["workerTaskStatus"]) =>
        prisma.batchCallTask.update({ where: { id }, data: { workerTaskStatus } })

    return {
        processing: () => update("processing"),
        completed: () => update("completed"),
        failed: () => update("failed"),
    }
}

// ===============================================================
// ==================== START OUTBOUND CALL ======================
// ===============================================================


export const batchCallInngestTaskProcess = batchCallInngestClient.createFunction(
    {
        id: BATCH_CALL_INNGEST_CONSTANTS.functions.dialer,
        retries: 0,
        triggers: [{ event: BATCH_CALL_INNGEST_CONSTANTS.events.callDispatch }],
    },
    async ({ event, step }) => {
        const { batchCallId, taskId, workspaceId, phoneNumberId, destinationNumber } = event.data

        await step.run(BATCH_CALL_INNGEST_CONSTANTS.steps.dialer.call(taskId), async () => {

            try {
                await startOutboundTestCall({ phoneNumberId, destinationNumber, workspaceId, batchCallId })

                await batchCallTaskUpdateWorkerStatus(taskId).completed()
            } catch (error) {
                console.error(`Batch call task ${taskId} failed`, error)
                await batchCallTaskUpdateWorkerStatus(taskId).failed()
            }
        })
    }
)

// =================================================================
// ================== CALL TIME WINDOW FUNCTIONS ===================
// =================================================================

function batchCallIsWithinTimeWindow(config: BatchCallGlobalType["timeWindow"]): boolean {
    if (!config) return true

    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: config.timezone ?? "UTC",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date())

    const get = (type: string) => parts.find(p => p.type === type)?.value ?? ""

    const day = get("weekday")
    const minutes = Number(get("hour")) * 60 + Number(get("minute"))

    return (
        (!config.day || config.day.includes(day as NonNullable<typeof config.day>[number])) &&
        config.windows.some(w => minutes >= w.start && minutes <= w.end)
    )
}

async function batchCallTriggerInngestServerForRerun(batchCallId: string, workspaceId: string, config: BatchCallGlobalType["timeWindow"]) {

    if (!config?.windows.length) return

    const pendingCount = await prisma.batchCallTask.count({
        where: {
            batchCallId,
            batchCall: { workspaceId },
            workerTaskStatus: "pending",
        },
    })

    if (!pendingCount) return

    const now = DateTime.now().setZone(config.timezone ?? "UTC")
    if (!now.isValid) throw new Error("Invalid calling timezone")

    const days = config.day ?? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",]
    if (!days.length) return

    let nextTimestamp: number | null = null

    for (let i = 0; i <= 7; i++) {
        const date = now.startOf("day").plus({ days: i })

        if (!days.includes(date.weekdayLong as typeof days[number])) continue

        for (const window of config.windows) {
            const start = date.plus({ minutes: window.start })
            const timestamp = start.toMillis()

            if (timestamp <= now.toMillis()) continue

            if (nextTimestamp === null || timestamp < nextTimestamp) {
                nextTimestamp = timestamp
            }
        }
    }

    if (nextTimestamp === null) { throw new Error("No upcoming calling window found") }

    return { pendingCount, nextTimestamp }
}
