"use server"

import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"

const purchaseSchema = z.object({
    phoneNumber: z.string().trim().regex(/^\+[1-9]\d{1,14}$/),
})

type PurchaseInput = z.infer<typeof purchaseSchema>

async function getPurchaseDetails(input: PurchaseInput) {
    const { phoneNumber } = purchaseSchema.parse(input)

    const workspaceId = await getCurrentWorkspaceId()
    const number = await prisma.phoneNumber.findFirst({
        where: { phoneNumber, workspaceId },
        select: { id: true, createdAt: true },
    })
    if (!number) throw new Error("Phone number not found in your workspace")

    const isTollFree = /^\+1(800|888|877|866|855|844|833)\d{7}$/.test(phoneNumber)

    return {
        phoneNumberId: number.id,
        workspaceId,
        money: new Prisma.Decimal(isTollFree ? 5 : 2),
        createdAt: number.createdAt,
    }
}

// Charge once per monthly anniversary, clamping to the last day of shorter months.
async function buildBillingCommand(tx: Prisma.TransactionClient, details: Awaited<ReturnType<typeof getPurchaseDetails>>) {
    const { phoneNumberId, workspaceId, money, createdAt } = details

    const sql = `
DECLARE
    today date := (now() AT TIME ZONE 'UTC')::date;
    bill_id text;
BEGIN
    -- Stop billing when the phone number no longer exists.
    IF NOT EXISTS (
        SELECT 1 FROM public."PhoneNumber"
        WHERE id = %1$L AND "workspaceId" = %2$L
    ) THEN
        RETURN;
    END IF;

    -- Skip the purchase month; charge on the anniversary, clamped to shorter months.
    IF (
        date_trunc('month', today::timestamp) <= date_trunc('month', %4$L::timestamp) OR
        EXTRACT(DAY FROM today)::integer <> LEAST(
            EXTRACT(DAY FROM %4$L::timestamp)::integer,
            EXTRACT(DAY FROM (
                date_trunc('month', today) + interval '1 month - 1 day'
            ))::integer
        )
    ) THEN RETURN; END IF;

    SELECT id INTO bill_id
    FROM public."Billing"
    WHERE "workspaceId" = %2$L;

    IF bill_id IS NULL THEN
        RAISE EXCEPTION 'Billing account not found';
    END IF;

    -- Unique transaction ID prevents duplicate monthly charges.
    INSERT INTO public."BillingTransaction"
        (id, "billingId", amount, description, "createdAt")
    VALUES (
        'phone-rental:' || %1$L || ':' || to_char(today, 'YYYY-MM'),
        bill_id,
        -(%3$L::numeric),
        'Monthly phone number rental: ' || %1$L || '; month=' || to_char(today, 'YYYY-MM'),
        now()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Deduct balance only when a new transaction was created.
    IF FOUND THEN
        UPDATE public."Billing"
        SET balance = balance - %3$L::numeric, "updatedAt" = now()
        WHERE id = bill_id;
    END IF;
END;
`

    const [result] = await tx.$queryRaw<{ command: string }[]>`
        SELECT format('DO %L', format(
            ${sql}::text,
            ${phoneNumberId}::text,
            ${workspaceId}::text,
            ${money.toString()}::text,
            ${createdAt.toISOString()}::text
        )) AS command
    `

    return result.command
}

export async function createPhoneNumberPurchaseCronJob(input: PurchaseInput) {
    const details = await getPurchaseDetails(input)
    const { phoneNumberId, workspaceId, createdAt } = details

    const monthlyName = `phone-rental:${phoneNumberId}:monthly`

    const day = createdAt.getUTCDate()
    const schedule = `0 0 ${day > 28 ? `28-${day}` : day} * *`

    return prisma.$transaction(async tx => {
        // Prevent concurrent requests from scheduling duplicate jobs.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${monthlyName}))::text`

        const [extension] = await tx.$queryRaw<{ installed: boolean }[]>`
            SELECT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
            ) AS installed
        `
        if (!extension?.installed) { throw new Error("Enable Supabase Cron (pg_cron) before scheduling phone number billing") }

        await tx.billing.findUniqueOrThrow({
            where: { workspaceId },
            select: { id: true },
        })

        const [existing] = await tx.$queryRaw<{ jobid: bigint }[]>`
            SELECT jobid FROM cron.job
            WHERE jobname = ${monthlyName} AND username = current_user
        `
        if (existing) { return { monthlyJobId: String(existing.jobid), alreadyScheduled: true } }

        // pg_cron interprets calendar expressions using cron.timezone.
        const [config] = await tx.$queryRaw<{ timezone: string }[]>`
            SELECT coalesce(current_setting('cron.timezone', true), 'GMT') AS timezone
        `
        if (!["GMT", "UTC", "Etc/UTC"].includes(config.timezone)) { throw new Error("Phone number billing expects cron.timezone to be UTC or GMT") }

        const monthlyCommand = await buildBillingCommand(tx, details)

        const [monthly] = await tx.$queryRaw<{ jobid: bigint }[]>`
            SELECT cron.schedule(
                ${monthlyName}, ${schedule}, ${monthlyCommand}
            ) AS jobid
        `

        return { monthlyJobId: String(monthly.jobid), alreadyScheduled: false }
    })
}





// MORE FUNCTIONS


export async function chargeUserAfterPhoneNumberPurchase(input: PurchaseInput) {
    const { phoneNumberId, workspaceId, money } = await getPurchaseDetails(input)

    await prisma.$transaction(async tx => {
        const billing = await tx.billing.findUniqueOrThrow({
            where: { workspaceId },
            select: { id: true },
        })

        // Repeated requests must not charge the initial purchase twice.
        const { count } = await tx.billingTransaction.createMany({
            data: {
                id: `phone-rental:${phoneNumberId}:0`,
                billingId: billing.id,
                amount: money.negated(),
                description: `Initial phone number purchase: ${phoneNumberId}`,
            },
            skipDuplicates: true,
        })

        if (count) {
            await tx.billing.update({
                where: { id: billing.id },
                data: { balance: { decrement: money } },
            })
        }
    })
}

export async function checkPhoneBalanceBeforePhoneNumberPurchase(requiredAmount: number = 5) {
    const workspaceId = await getCurrentWorkspaceId()

    const billing = await prisma.billing.findUnique({
        where: { workspaceId },
        select: { balance: true },
    })

    if (!billing) return { success: false, error: "Billing account not found." }

    if (billing.balance.lt(requiredAmount)) { return { success: false, error: `Insufficient balance. You need $${requiredAmount.toFixed(2)}. Current balance: $${billing.balance.toFixed(2)}.`, } }

    return { success: true }
}
