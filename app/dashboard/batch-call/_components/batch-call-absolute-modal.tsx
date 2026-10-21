import { getPhoneNumbers } from "@/app/dashboard/phone-numbers/_lib/phone-number-config-actions"
import { BatchCallAbsoluteModalClient } from "./batch-call-absolute-modal-client"

export async function BatchCallAbsoluteModal() {
    const phoneNumbers = await getPhoneNumbers()

    return <BatchCallAbsoluteModalClient phoneNumbers={phoneNumbers} />
}
