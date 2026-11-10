import { serve } from "inngest/next"

import {
    batchCallInngestClient,
    batchCallInngestProcess,
    batchCallInngestTaskProcess
} from "@/app/dashboard/batch-call/_actions/batch-call-inngest-actions"
import { scrubbedPostSessionTranscriptWithToolCallsInngestProcess } from "@/app/api/livekit/sessionReport/scrubbed_post_session_pipeline-inggest-actions"

export const { GET, POST, PUT } = serve({
    client: batchCallInngestClient,
    functions: [
        batchCallInngestProcess,
        batchCallInngestTaskProcess,
        scrubbedPostSessionTranscriptWithToolCallsInngestProcess
    ],
})
