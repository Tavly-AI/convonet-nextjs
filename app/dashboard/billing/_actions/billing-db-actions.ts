import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import type { BillingGlobalTypes } from "../_lib/billing-global-types"

export async function billing_DB_chargeCall({ workspaceId, callId, amount, callCost }: BillingGlobalTypes["ChargeCallInput"]) {
    await prisma.$transaction(async (tx) => {
        const billing = await tx.billing.findUniqueOrThrow({ where: { workspaceId } })

        await tx.billingTransaction.create({
            data: { billingId: billing.id, callId, amount: new Prisma.Decimal(-amount), description: "Call usage" },
        })

        await tx.billing.update({
            where: { id: billing.id },
            data: { balance: { decrement: amount } },
        })

        await tx.callRecord.update({
            where: { call_id: callId, workspaceId },
            data: { call_cost: callCost },
        })
    })
}