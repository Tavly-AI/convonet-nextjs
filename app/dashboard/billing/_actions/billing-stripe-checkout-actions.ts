"use server"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { getStripe } from "@/lib/stripe"
import { BILLING_GLOBAL_CONFIG_VALUES } from "../_lib/payment-config"

const { currency, minimumRecharge } = BILLING_GLOBAL_CONFIG_VALUES.config

export async function billingCreateStripCheckout(amount: string) {
    const workspaceId = await getCurrentWorkspaceId()
    const amountCents = Math.round(Number(amount) * 100)

    if (!/^\d+(\.\d{1,2})?$/.test(amount) || !Number.isSafeInteger(amountCents) || amountCents < minimumRecharge * 100) { throw new Error(`Enter at least $${minimumRecharge} USD with up to two decimal places`) }

    const billingUrl = new URL("/dashboard/billing", process.env.APP_URL)
    const { url } = await getStripe().checkout.sessions.create({
        mode: "payment",
        managed_payments: { enabled: false },
        metadata: { workspaceId, purpose: "workspace_top_up" },
        line_items: [{
            quantity: 1,
            price_data: {
                currency,
                unit_amount: amountCents,
                product_data: { name: "Workspace credits" },
            },
        }],
        success_url: `${billingUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${billingUrl}?canceled=1`,
    })

    if (!url) throw new Error("Could not open checkout")
    return url
}
