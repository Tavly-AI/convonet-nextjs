import { getPhoneNumbers } from "@/app/dashboard/phone-numbers/_lib/phone-number-config-actions"
import { BatchCallAbsoluteModalClient } from "./batch-call-absolute-modal-client"
import { batchCall_DB_getAvailableWorkSpaceConnuruncy } from "../_actions/batch-call-db-actions"

export async function BatchCallAbsoluteModal() {
    const phoneNumbers = await getPhoneNumbers()
    const availableWorkspaceConcurrency = await batchCall_DB_getAvailableWorkSpaceConnuruncy()

    return <BatchCallAbsoluteModalClient phoneNumbers={phoneNumbers} availableWorkspaceConcurrency={availableWorkspaceConcurrency} />
}
