import { Suspense } from "react"
import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"
import { BillingHistoryDashboardClient } from "./_components/billing-history-dashboard-client"

export default async function BillingPage() {
    const workspaceId = await getCurrentWorkspaceId()
    const billingData = await prisma.billing.upsert({
        where: { workspaceId },
        create: { workspaceId },
        update: {},
        include: {
            transactions: {
                where: { stripeCheckoutSessionId: { not: null } },
                orderBy: { createdAt: "desc" },
                take: 50,
            },
        },
    })
    return (
        <Suspense>
            <BillingHistoryDashboardClient
                balance={billingData.balance.toFixed(2)}
                transactions={billingData.transactions.map(({ id, createdAt, amount, description, stripeCheckoutSessionId }) => ({
                    id, createdAt, description, stripeCheckoutSessionId, amount: amount.toFixed(2),
                }))}
            />
        </Suspense>
    )
}
