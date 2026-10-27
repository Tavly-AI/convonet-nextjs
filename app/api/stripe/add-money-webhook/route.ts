import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { BILLING_GLOBAL_CONFIG_VALUES } from "@/app/dashboard/billing/_lib/payment-config"
import type Stripe from "stripe"

const { currency, minimumRecharge } = BILLING_GLOBAL_CONFIG_VALUES.config

export async function POST(request: Request) {

    const event = await verifyStripeWebhook(request)
    if (!event) { return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 }) }
    if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") { return NextResponse.json({ received: true }) }

    const session = event.data.object
    if (session.metadata?.purpose !== "workspace_top_up" || session.payment_status !== "paid") { return NextResponse.json({ received: true }) }

    const workspaceId = session.metadata.workspaceId
    if (!workspaceId || session.mode !== "payment" || session.currency !== currency || !session.amount_total || session.amount_total < minimumRecharge * 100) { return NextResponse.json({ error: "Invalid top-up payment" }, { status: 400 }) }

    try {
        await creditWorkspace(workspaceId, session.amount_total, session.id)
        revalidatePath("/dashboard/billing")
        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Failed to credit Stripe payment", session.id, error)
        return NextResponse.json({ error: "Could not credit payment" }, { status: 500 })
    }
}

async function creditWorkspace(workspaceId: string, amountCents: number, sessionId: string) {
    const amount = new Prisma.Decimal(amountCents).div(100)
    const transactions = { create: { amount, description: "Stripe credit top-up", stripeCheckoutSessionId: sessionId } }

    try {
        await prisma.billing.upsert({
            where: { workspaceId },
            create: { workspaceId, balance: amount, transactions },
            update: { balance: { increment: amount }, transactions },
        })
    } catch (error) {
        // Stripe may deliver the same payment more than once
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const existing = await prisma.billingTransaction.findUnique({
                where: { stripeCheckoutSessionId: sessionId },
            })
            if (existing) return
        }
        throw error
    }
}

async function verifyStripeWebhook(request: Request): Promise<Stripe.Event | null> {
    try {
        return getStripe().webhooks.constructEvent(
            await request.text(),
            request.headers.get("stripe-signature") ?? "",
            process.env.STRIPE_WEBHOOK_SECRET!,
        )
    } catch {
        return null
    }
}