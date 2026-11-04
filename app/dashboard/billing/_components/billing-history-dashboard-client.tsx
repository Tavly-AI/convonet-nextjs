"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { BillingTransaction } from "@/generated/prisma/browser"

import { CircleCheck, Clock3, Info, Receipt, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import { BillingBuyCreditsModal } from "./billing-buy-credits-modal"

type BillingHistoryDashboardClientProps = {
    balance: string
    transactions: (Pick<BillingTransaction, "id" | "createdAt" | "stripeCheckoutSessionId" | "description"> & { amount: string })[]
}

export function BillingHistoryDashboardClient({ balance, transactions }: BillingHistoryDashboardClientProps) {

    const params = useSearchParams()
    const sessionId = params.get("session_id")
    const credited = sessionId !== null && transactions.some(transaction => transaction.stripeCheckoutSessionId === sessionId)

    const { state: sidebarState, isMobile } = useSidebar()

    return (
        <main className={cn(
            "m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6",
            !isMobile && sidebarState === "expanded" && "max-w-[calc(100vw-var(--sidebar-width)-2rem)]",
        )}>
            <div>
                <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
                <p className="text-sm text-muted-foreground">Manage your workspace credits and review your payments.</p>
            </div>

            {sessionId !== null && <BillingPaymentStatusBar key={sessionId} credited={credited} />}
            {params.get("canceled") === "1" && (
                <div role="status" className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    <Info className="size-4 shrink-0" aria-hidden />
                    <p>Checkout canceled. No credits were added.</p>
                </div>
            )}

            <section aria-labelledby="credits-heading" className="overflow-hidden rounded-xl border">
                <div className="flex flex-wrap items-center justify-between gap-6 p-5 lg:p-6">
                    <div className="space-y-3">
                        <h2 id="credits-heading" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Wallet className="size-4" aria-hidden />
                            Available credits
                        </h2>
                        <p className="flex items-baseline gap-2">
                            <span className="text-4xl font-semibold tracking-tight tabular-nums">${balance}</span>
                            <span className="text-sm text-muted-foreground">USD</span>
                        </p>
                    </div>
                    <BillingBuyCreditsModal />
                </div>
                <div className="flex items-start gap-2 border-t bg-muted/40 px-5 py-3 text-sm text-muted-foreground lg:px-6">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <p>Add credits to keep your agents running. Payments are processed securely through Stripe.</p>
                </div>
            </section>

            <section aria-labelledby="history-heading" className="flex min-w-0 flex-col gap-4">
                <div>
                    <h2 id="history-heading" className="text-base font-semibold tracking-tight">Billing history</h2>
                    <p className="text-sm text-muted-foreground">Your latest credit top-ups. All amounts are in USD.</p>
                </div>
                <BillingHistory transactions={transactions} />
            </section>
        </main>
    )
}

function BillingHistory({ transactions }: Pick<BillingHistoryDashboardClientProps, "transactions">) {
    if (!transactions.length) {
        return (
            <div className="flex flex-col items-center rounded-xl border px-6 py-14 text-center">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Receipt className="size-5 text-muted-foreground" aria-hidden />
                </div>
                <h3 className="text-sm font-medium">No payments yet</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Buy credits to get started. Your completed top-ups will appear here.</p>
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-xl border">
            <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/60">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="h-12 w-1/4 pl-4">Payment date</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                        <TableHead className="w-32 pr-4 text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell className="h-16 pl-4 font-medium">
                                {transaction.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                            </TableCell>
                            <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                                {transaction.description || "Credit top-up"}
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                                    Paid
                                </span>
                            </TableCell>
                            <TableCell className="pr-4 text-right font-medium tabular-nums">${transaction.amount}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function BillingPaymentStatusBar({ credited }: { credited: boolean }) {
    const router = useRouter()
    const [attempts, setAttempts] = useState(0)

    useEffect(() => {
        if (credited || attempts >= 10) return
        const timer = setTimeout(() => {
            router.refresh()
            setAttempts(value => value + 1)
        }, 3000)
        return () => clearTimeout(timer)
    }, [credited, attempts, router])

    return (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
                {credited
                    ? <CircleCheck className="size-4 shrink-0 text-emerald-500" aria-hidden />
                    : <Clock3 className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                <p>{credited ? "Payment received. Your credits have been added." : "Waiting for payment confirmation. Your balance will update once it arrives."}</p>
            </div>
            {!credited && attempts >= 10 && <Button variant="outline" onClick={() => { router.refresh(); setAttempts(0) }}>Refresh</Button>}
        </div>
    )
}
