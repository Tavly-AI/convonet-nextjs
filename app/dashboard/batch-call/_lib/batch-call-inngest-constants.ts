const PIPELINE_NAME = "outbound-batch-call-pipeline"
const PIPELINE_VERSION = "v1"
const STEP_PREFIX = "outbound-batch-call"

export const BATCH_CALL_INNGEST_CONSTANTS = {
    app: {
        clientId: `${PIPELINE_NAME}-${PIPELINE_VERSION}`,
    },

    functions: {
        scheduler: `${PIPELINE_NAME}-scheduler-${PIPELINE_VERSION}`,
        dialer: `${PIPELINE_NAME}-dialer-${PIPELINE_VERSION}`,
    },

    events: {
        batchCreated: `${PIPELINE_NAME}/created-${PIPELINE_VERSION}`,
        callDispatch: `${PIPELINE_NAME}/dispatch-${PIPELINE_VERSION}`,
    },


    steps: {
        scheduler: {
            scheduling: {
                getBatch: `${STEP_PREFIX}-fetch-batch-schedule`,
                waitUntilScheduled: `${STEP_PREFIX}-wait-until-scheduled-time`,
                checkBatchRerun: (id: string) => `${STEP_PREFIX}-check-next-calling-window-${id}`,
                waitNextWindow: (id: string) => `${STEP_PREFIX}-wait-next-calling-window-${id}`,
            },

            concurrency: {
                check: (id: string, attempt: number) => `${STEP_PREFIX}-check-active-call-limit-${id}-${attempt}`,
                waitForSlot: (id: string, attempt: number) => `${STEP_PREFIX}-wait-available-call-slot-${id}-${attempt}`,
            },

            task: {
                processing: (id: string) => `${STEP_PREFIX}-mark-task-processing-${id}`,
                dispatch: (id: string) => `${STEP_PREFIX}-dispatch-outbound-call-${id}`,
                cpsWait: (id: string) => `${STEP_PREFIX}-enforce-calls-per-second-${id}`,
            },
        },

        dialer: {
            call: (id: string) => `${STEP_PREFIX}-initiate-outbound-call-${id}`,
        },
    },
} as const