import { serve } from "inngest/next"

import {
    batchCallInngestClient,
    batchCallInngestProcess,
    batchCallInngestTaskProcess
} from "@/app/dashboard/batch-call/_actions/batch-call-inngest-actions"

export const { GET, POST, PUT } = serve({
    client: batchCallInngestClient,
    functions: [batchCallInngestProcess, batchCallInngestTaskProcess],
})