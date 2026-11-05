"use server"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { z } from "zod"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { BILLING_GLOBAL_CONFIG_VALUES } from "../../billing/_lib/billing-payment-config"


// ==================================================
// ============= GET WORKSPACE KB ===================
// ==================================================


export async function knowledgeBase_DB_getWorkspaceKnowledgeBaseCount(): Promise<number> {
    const workspaceId = await getCurrentWorkspaceId()

    return prisma.knowledgeBase.count({
        where: { workspaceId },
    })
}


// ==================================================
// ================ CHECK BALANCE ===================
// ==================================================


export async function knowledgeBase_checkKnowledgeBaseBalance() {
    const workspaceId = await getCurrentWorkspaceId()

    const billing = await prisma.billing.findUnique({
        where: { workspaceId },
        select: { balance: true },
    })

    if (!billing) return { success: false, error: "Billing account not found." }

    if (billing.balance.lt(BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerAdditionalKnowledgeBasePerMonth)) {
        return {
            success: false,
            error: `Insufficient balance. You need $${BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerAdditionalKnowledgeBasePerMonth.toFixed(2)}. Current balance: $${billing.balance.toFixed(2)}.`,
        }
    }

    return { success: true }
}


// ==================================================
// ================ CRON JOB START ==================
// ==================================================


const knowledgeBaseBillingSchema = z.object({
    knowledgeBaseId: z.string().trim().min(1),
})

type KnowledgeBaseBillingInput = z.infer<typeof knowledgeBaseBillingSchema>

async function getKnowledgeBaseBillingDetails(input: KnowledgeBaseBillingInput) {
    const { knowledgeBaseId } = knowledgeBaseBillingSchema.parse(input)
    const workspaceId = await getCurrentWorkspaceId()
    const knowledgeBase = await prisma.knowledgeBase.findFirst({
        where: { id: knowledgeBaseId, workspaceId },
        select: { id: true, createdAt: true },
    })
    if (!knowledgeBase) throw new Error("Knowledge base not found in your workspace")

    const freeBases = await prisma.knowledgeBase.findMany({
        where: { workspaceId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: BILLING_GLOBAL_CONFIG_VALUES.kb.freeKnowledgeBases,
        select: { id: true },
    })

    return {
        knowledgeBaseId,
        workspaceId,
        createdAt: knowledgeBase.createdAt,
        money: new Prisma.Decimal(BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerAdditionalKnowledgeBasePerMonth),
        isFree: freeBases.some(base => base.id === knowledgeBaseId),
    }
}

// Charge once per monthly anniversary, clamping to the last day of shorter months.
async function buildBillingCommand(tx: Prisma.TransactionClient, details: Awaited<ReturnType<typeof getKnowledgeBaseBillingDetails>>) {
    const { knowledgeBaseId, workspaceId, money, createdAt } = details

    const sql = `
DECLARE
    today date := (now() AT TIME ZONE 'UTC')::date;
    bill_id text;
BEGIN
    -- Deleted bases and the oldest free bases are not billed.
    IF NOT EXISTS (
        SELECT 1 FROM public."KnowledgeBase"
        WHERE id = %1$L AND "workspaceId" = %2$L
    ) OR %1$L IN (
        SELECT id FROM public."KnowledgeBase" WHERE "workspaceId" = %2$L
        ORDER BY "createdAt", id LIMIT %5$L::integer
    ) THEN RETURN; END IF;

    -- Skip the creation month; clamp anniversaries to the month's last day.
    IF date_trunc('month', today::timestamp) <= date_trunc('month', %4$L::timestamp)
        OR EXTRACT(DAY FROM today) <> LEAST(
            EXTRACT(DAY FROM %4$L::timestamp),
            EXTRACT(DAY FROM date_trunc('month', today) + interval '1 month - 1 day')
        ) THEN RETURN; END IF;

    SELECT id INTO bill_id FROM public."Billing" WHERE "workspaceId" = %2$L;
    IF bill_id IS NULL THEN RAISE EXCEPTION 'Billing account not found'; END IF;

    INSERT INTO public."BillingTransaction" (id, "billingId", amount, description, "createdAt")
    VALUES (
        'knowledge-base:' || %1$L || ':' || to_char(today, 'YYYY-MM'),
        bill_id, -(%3$L::numeric),
        'Monthly knowledge base: ' || %1$L || '; month=' || to_char(today, 'YYYY-MM'), now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Only a new transaction deducts balance.
    IF FOUND THEN
        UPDATE public."Billing" SET balance = balance - %3$L::numeric, "updatedAt" = now()
        WHERE id = bill_id;
    END IF;
END;
`

    const [result] = await tx.$queryRaw<{ command: string }[]>`
        SELECT format('DO %L', format(
            ${sql}::text,
            ${knowledgeBaseId}::text,
            ${workspaceId}::text,
            ${money.toString()}::text,
            ${createdAt.toISOString()}::text,
            ${String(BILLING_GLOBAL_CONFIG_VALUES.kb.freeKnowledgeBases)}::text
        )) AS command
    `

    return result.command
}

export async function knowledgeBase_createKnowledgeBaseMonthlyCronJob(input: KnowledgeBaseBillingInput) {
    const details = await getKnowledgeBaseBillingDetails(input)
    const { knowledgeBaseId, workspaceId, createdAt, isFree } = details
    if (isFree) return { monthlyJobId: null, alreadyScheduled: false }

    const monthlyName = `knowledge-base:${knowledgeBaseId}:monthly`

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
        if (!extension?.installed) { throw new Error("Enable Supabase Cron (pg_cron) before scheduling knowledge base billing") }

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
        if (!["GMT", "UTC", "Etc/UTC"].includes(config.timezone)) { throw new Error("Knowledge base billing expects cron.timezone to be UTC or GMT") }

        const monthlyCommand = await buildBillingCommand(tx, details)

        const [monthly] = await tx.$queryRaw<{ jobid: bigint }[]>`
            SELECT cron.schedule(
                ${monthlyName}, ${schedule}, ${monthlyCommand}
            ) AS jobid
        `

        return { monthlyJobId: String(monthly.jobid), alreadyScheduled: false }
    })
}



// ==================================================
// ================ INIT CHARGE =====================
// ==================================================


export async function knowledgeBase_chargeUserAfterKnowledgeBaseCreation(input: KnowledgeBaseBillingInput) {
    const { knowledgeBaseId, workspaceId, money, isFree } = await getKnowledgeBaseBillingDetails(input)
    if (isFree) return

    await prisma.$transaction(async tx => {
        const billing = await tx.billing.findUniqueOrThrow({
            where: { workspaceId },
            select: { id: true },
        })

        // Repeated requests must not charge the initial creation twice.
        const { count } = await tx.billingTransaction.createMany({
            data: {
                id: `knowledge-base:${knowledgeBaseId}:0`,
                billingId: billing.id,
                amount: money.negated(),
                description: `Initial knowledge base creation: ${knowledgeBaseId}`,
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
