"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { BillingTransaction } from "@/generated/prisma/browser"

import {
    ArrowUpRight,
    ChevronDown,
    Info,
    MoreHorizontal,
    Receipt,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BillingBuyCreditsModal } from "./billing-buy-credits-modal"

type BillingHistoryDashboardClientProps = {
    balance: string
    transactions: (Pick<BillingTransaction, "id" | "createdAt" | "stripeCheckoutSessionId" | "description"> & { amount: string })[]
}

export function BillingHistoryDashboardClient({ balance, transactions }: BillingHistoryDashboardClientProps) {

    const params = useSearchParams()
    const sessionId = params.get("session_id")
    const credited = sessionId !== null && transactions.some(transaction => transaction.stripeCheckoutSessionId === sessionId)

    return (
        <main className="flex min-h-0 flex-1 flex-col gap-5 p-4 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="flex items-center gap-2.5 text-base font-medium">
                    <Receipt className="size-5 text-muted-foreground" />
                    Billing
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="ghost" size="icon" aria-label="More billing options">
                        <MoreHorizontal />
                    </Button>
                    <Button variant="outline" className="rounded-xl font-normal text-muted-foreground">
                        <ArrowUpRight />
                        Change payment methods
                    </Button>
                    <Button className="rounded-xl font-normal">
                        <ArrowUpRight />
                        Manage billing info
                    </Button>
                </div>
            </div>

            {sessionId !== null && <BillingPaymentStatusBar key={sessionId} credited={credited} />}
            {params.get("canceled") === "1" && <p role="status" className="text-sm text-muted-foreground">Checkout canceled. No credits were added.</p>}

            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-500/10 px-4 py-3">
                <Info className="size-4 shrink-0 text-blue-600" />
                <p className="flex-1 text-sm leading-6 text-foreground">
                    Enable auto-recharge to avoid call interruptions when your balance runs out.{" "}
                    <button type="button" className="underline underline-offset-4">Learn more</button>
                </p>
                <Button variant="outline" className="font-normal text-muted-foreground">
                    Enable
                </Button>
            </div>

            <section aria-labelledby="credits-heading" className="flex flex-wrap items-center justify-between gap-6 rounded-xl border p-5">
                <div>
                    <h2 id="credits-heading" className="text-sm font-medium">Credits Balance</h2>
                    <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums">${balance}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <BillingBuyCreditsModal />
                </div>
            </section>

            <section aria-label="Billing activity" className="min-w-0">
                <Tabs defaultValue="billing">
                    <TabsList variant="line" className="h-10 w-full justify-start gap-5 rounded-none border-b p-0">
                        <TabsTrigger value="billing" className="flex-none px-0">Billing History</TabsTrigger>
                        <TabsTrigger value="usage" className="flex-none px-0">Usage</TabsTrigger>
                    </TabsList>
                    <TabsContent value="billing" className="mt-2">
                        <BillingHistory transactions={transactions} />
                    </TabsContent>
                    <TabsContent value="usage" className="mt-2">
                        <BillingUsage />
                    </TabsContent>
                </Tabs>
            </section>
        </main>
    )
}

function BillingHistory({ transactions }: Pick<BillingHistoryDashboardClientProps, "transactions">) {
    return (
        <Table className="min-w-[680px]">
            <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-1/5 pl-4 font-normal text-muted-foreground">Payment date</TableHead>
                    <TableHead className="w-1/5 font-normal text-muted-foreground">Amount</TableHead>
                    <TableHead className="w-[30%] font-normal text-muted-foreground">Details</TableHead>
                    <TableHead className="font-normal text-muted-foreground">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                        <TableCell className="pl-4 text-muted-foreground">
                            <span className="flex items-center gap-3 whitespace-nowrap">
                                <ChevronDown className="size-4 text-foreground/80" />
                                {transaction.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}
                            </span>
                        </TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">${transaction.amount}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="text-muted-foreground">Paid</TableCell>
                    </TableRow>
                ))}
                {!transactions.length && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No top-ups yet.</TableCell></TableRow>}
            </TableBody>
        </Table>
    )
}

function BillingUsage() {
    return <p className="py-8 text-center text-muted-foreground">Usage reporting is not available yet.</p>
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
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
            <p>{credited ? "Payment received. Your credits have been added." : "Waiting for payment confirmation. Your balance will update once it arrives."}</p>
            {!credited && attempts >= 10 && <Button variant="outline" onClick={() => { router.refresh(); setAttempts(0) }}>Refresh</Button>}
        </div>
    )
}
