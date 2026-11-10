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




const SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_NAME = "scrubbed-post-session-transcript-with-tool-calls-pipeline"
const SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_VERSION = "v1"

export const SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_INNGEST_CONSTANTS = {
    app: {
        clientId: `${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_NAME}-${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_VERSION}`,
    },

    functions: {
        process: `${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_NAME}-process-${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_VERSION}`,
    },

    events: {
        created: `${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_NAME}/created-${SCRUBBED_POST_SESSION_TRANSCRIPT_WITH_TOOL_CALLS_PIPELINE_VERSION}`,
    },

    steps: {
        process: {
            getCall: "get-call-transcript_with_tool_calls-and-agent-details",
            redactAudio: "call-assembly-ai-pipeline-get-raw-replacements-and-raw-audio-url",
            saveScrubbedTranscript: "save-scrubbed-transcript-and-scrubbed-audio-url-in-db",
        },
    },
} as const
