"use server"

import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentUserId } from "@/lib/auth"
import { WorkspaceRole } from "@/lib/enums/roles"
import { BILLING_GLOBAL_CONFIG_VALUES } from "@/app/dashboard/billing/_lib/billing-payment-config"
import { revalidatePath } from "next/cache"

const limitSchema = z.number().int().min(BILLING_GLOBAL_CONFIG_VALUES.concurrency.freeConcurrentCalls).max(2147483647)
const purchaseSchema = z.object({
    concurrentCallsLimit: limitSchema,
    expectedLimit: limitSchema,
    requestId: z.string().uuid(),
})

type PurchaseInput = z.infer<typeof purchaseSchema>
type PurchaseDetails = Awaited<ReturnType<typeof getPurchaseDetails>>

// MONTHLY CRON JOB
async function createConcurrencyMonthlyCronJob(tx: Prisma.TransactionClient, details: PurchaseDetails) {
    const { anniversary, monthlyName } = details
    if (!anniversary || details.limit <= BILLING_GLOBAL_CONFIG_VALUES.concurrency.freeConcurrentCalls) return
    const [config] = await tx.$queryRaw<{ installed: boolean; timezone: string }[]>`
        SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') AS installed,
            coalesce(current_setting('cron.timezone', true), 'GMT') AS timezone
    `
    if (!config.installed) throw new Error("Enable Supabase Cron (pg_cron) before purchasing concurrency")
    if (!["GMT", "UTC", "Etc/UTC"].includes(config.timezone)) {
        throw new Error("Concurrency billing expects cron.timezone to be UTC or GMT")
    }

    const day = anniversary.getUTCDate()
    const schedule = `0 0 ${day > 28 ? `28-${day}` : day} * *`
    const command = await buildBillingCommand(tx, details)
    // Scheduling the same named job updates it instead of creating a duplicate.
    await tx.$queryRaw`SELECT cron.schedule(${monthlyName}, ${schedule}, ${command}) AS jobid`
}

// Charge once per monthly anniversary, clamping to the last day of shorter months.
async function buildBillingCommand(tx: Prisma.TransactionClient, { workspaceId, monthlyName }: PurchaseDetails) {
    const sql = `
DECLARE
    today date := (now() AT TIME ZONE 'UTC')::date;
    anniversary timestamp;
    slots integer;
    money numeric;
    bill_id text;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext(%1$L));
    SELECT "concurrentCallsLimit", "concurrencyBillingStartedAt" INTO slots, anniversary
    FROM public."Workspace" WHERE id = %2$L;
    IF NOT FOUND OR anniversary IS NULL OR slots <= %3$L::integer THEN RETURN; END IF;

    IF date_trunc('month', today::timestamp) <= date_trunc('month', anniversary)
        OR EXTRACT(DAY FROM today) <> LEAST(
            EXTRACT(DAY FROM anniversary),
            EXTRACT(DAY FROM date_trunc('month', today) + interval '1 month - 1 day')
        ) THEN RETURN; END IF;

    money := (slots - %3$L::integer) * %4$L::numeric;
    SELECT id INTO bill_id FROM public."Billing" WHERE "workspaceId" = %2$L;
    IF bill_id IS NULL THEN RAISE EXCEPTION 'Billing account not found'; END IF;

    INSERT INTO public."BillingTransaction" (id, "billingId", amount, description, "createdAt")
    VALUES (
        'concurrency:' || %2$L || ':' || to_char(today, 'YYYY-MM'),
        bill_id, -money,
        'Monthly concurrency: ' || (slots - %3$L::integer)::text || ' additional slots; month=' || to_char(today, 'YYYY-MM'), now()
    ) ON CONFLICT (id) DO NOTHING;
    IF FOUND THEN
        UPDATE public."Billing" SET balance = balance - money, "updatedAt" = now() WHERE id = bill_id;
    END IF;
END;
`
    const [result] = await tx.$queryRaw<{ command: string }[]>`
        SELECT format('DO %L', format(
            ${sql}::text, ${monthlyName}::text, ${workspaceId}::text,
            ${String(BILLING_GLOBAL_CONFIG_VALUES.concurrency.freeConcurrentCalls)}::text,
            ${String(BILLING_GLOBAL_CONFIG_VALUES.concurrency.pricePerAdditionalConcurrentCallPerMonth)}::text
        )) AS command
    `
    return result.command
}

// INITIAL CHARGE + BALANCE CHECK
async function chargeUserAfterConcurrencyPurchase(tx: Prisma.TransactionClient, details: PurchaseDetails) {
    const { workspaceId, addedSlots, money, transactionId, currentLimit, limit } = details
    if (!addedSlots) return

    const billing = await tx.billing.findUniqueOrThrow({ where: { workspaceId }, select: { id: true } })

    const { count } = await tx.billing.updateMany({
        where: { id: billing.id, balance: { gte: money } },
        data: { balance: { decrement: money } },
    })
    if (!count) throw new Error(`Insufficient balance. You need $${money.toFixed(2)}.`)

    await tx.billingTransaction.create({
        data: {
            id: transactionId, billingId: billing.id, amount: money.negated(),
            description: `Concurrency increase: ${currentLimit} to ${limit}; ${addedSlots} additional slots`,
        },
    })
}

// SAVE: keep the initial charge, cron job, and workspace limit in one transaction.
export async function concurrencyPurchase(input: PurchaseInput) {
    const result = await prisma.$transaction(async tx => {

        const details = await getPurchaseDetails(tx, input)
        const { workspaceId, currentLimit, limit, expectedLimit, transactionId, anniversary } = details

        const previous = await tx.billingTransaction.findUnique({ where: { id: transactionId }, select: { id: true } })
        if (previous || currentLimit === limit) return { concurrentCallsLimit: currentLimit }
        if (currentLimit !== expectedLimit) throw new Error("Concurrency changed since this page loaded. Refresh and try again.")

        await createConcurrencyMonthlyCronJob(tx, details)
        await chargeUserAfterConcurrencyPurchase(tx, details)

        await tx.workspace.update({
            where: { id: workspaceId },
            data: { concurrentCallsLimit: limit, concurrencyBillingStartedAt: anniversary },
        })

        return { concurrentCallsLimit: limit }
    })
    revalidatePath("/dashboard/settings/limits")
    revalidatePath("/dashboard/billing")
    return result
}



// MISC CODE


// purchase details
async function getPurchaseDetails(tx: Prisma.TransactionClient, input: PurchaseInput) {
    const { concurrentCallsLimit: limit, expectedLimit, requestId } = purchaseSchema.parse(input)

    const userId = await getCurrentUserId()
    if (!userId) throw new Error("Unauthorized")
    const user = await tx.user.findUnique({ where: { id: userId }, select: { workspaceId: true, role: true } })
    if (!user?.workspaceId || user.role !== WorkspaceRole.ADMIN) { throw new Error("Only workspace admins can change concurrency.") }

    const workspaceId = user.workspaceId
    const monthlyName = `concurrency:${workspaceId}:monthly`

    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${monthlyName}))::text`
    const { concurrentCallsLimit: currentLimit, concurrencyBillingStartedAt } = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } })
    const addedSlots = Math.max(0, limit - currentLimit)

    return {
        workspaceId, monthlyName, currentLimit, limit, expectedLimit, addedSlots,
        transactionId: `concurrency:${workspaceId}:purchase:${requestId}`,
        money: new Prisma.Decimal(BILLING_GLOBAL_CONFIG_VALUES.concurrency.pricePerAdditionalConcurrentCallPerMonth).mul(addedSlots),
        anniversary: concurrencyBillingStartedAt ?? (addedSlots > 0 ? new Date() : null),
    }
}