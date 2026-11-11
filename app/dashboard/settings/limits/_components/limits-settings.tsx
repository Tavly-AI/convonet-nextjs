"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { concurrencyPurchase } from "../_actions/concurrency-purchase-monthly-cron-job"
import { BILLING_GLOBAL_CONFIG_VALUES } from "@/app/dashboard/billing/_lib/billing-payment-config"
import { InfoIcon, MinusIcon, PencilLineIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const telephonyLimits = [
    "Twilio CPS",
    "Custom Telephony CPS",
]

const { freeConcurrentCalls, pricePerAdditionalConcurrentCallPerMonth } = BILLING_GLOBAL_CONFIG_VALUES.concurrency

export function LimitsSettings({ concurrentCalls }: { concurrentCalls: number }) {
    const [draftCalls, setDraftCalls] = useState(concurrentCalls)
    const [adjustOpen, setAdjustOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const request = useRef<Parameters<typeof concurrencyPurchase>[0] | null>(null)
    const router = useRouter()

    async function save() {
        if (saving) return
        setSaving(true)
        if (!request.current || request.current.concurrentCallsLimit !== draftCalls || request.current.expectedLimit !== concurrentCalls) {
            request.current = { concurrentCallsLimit: draftCalls, expectedLimit: concurrentCalls, requestId: crypto.randomUUID() }
        }
        try {
            await concurrencyPurchase(request.current)
            request.current = null
            setAdjustOpen(false)
            toast.success("Concurrency limit updated")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to update concurrency")
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="flex min-w-0 flex-1 flex-col p-4 lg:p-6">
            <section
                aria-labelledby="limits-heading"
                className="flex min-h-[calc(100svh-var(--header-height)-3rem)] flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 md:p-5"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 id="limits-heading" className="text-lg font-medium">
                        Limits
                    </h1>
                </div>

                <div className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                            <h2 className="text-sm text-muted-foreground">Concurrent Calls Limit</h2>
                            <p className="text-xl font-medium tabular-nums">{concurrentCalls}</p>
                        </div>
                        <Dialog
                            open={adjustOpen}
                            onOpenChange={(open) => {
                                if (saving) return
                                if (open) setDraftCalls(concurrentCalls)
                                setAdjustOpen(open)
                            }}
                        >
                            <DialogTrigger render={<Button variant="outline" />}>
                                <PencilLineIcon aria-hidden="true" />
                                Adjust Concurrency
                            </DialogTrigger>
                            <DialogContent showCloseButton={false} className="max-w-lg bg-card p-5 sm:p-6">
                                <DialogHeader>
                                    <DialogTitle>Adjust Limit</DialogTitle>
                                    <DialogDescription>
                                        Increases are charged immediately at the full monthly price per added slot.
                                        Reductions do not refund the current cycle. Paid slots renew on your
                                        original monthly anniversary.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="my-6 space-y-5">
                                    <div className="space-y-2">
                                        <label htmlFor="concurrent-calls" className="text-sm font-medium">
                                            Concurrent Calls
                                        </label>
                                        <div className="flex h-10 items-center overflow-hidden rounded-lg border">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-full rounded-none border-r"
                                                aria-label="Decrease concurrent calls"
                                                disabled={saving || draftCalls <= freeConcurrentCalls}
                                                onClick={() => setDraftCalls((value) => Math.max(freeConcurrentCalls, value - 1))}
                                            >
                                                <MinusIcon aria-hidden="true" />
                                            </Button>
                                            <input
                                                id="concurrent-calls"
                                                type="number"
                                                disabled={saving}
                                                min={freeConcurrentCalls}
                                                max={2147483647}
                                                step={1}
                                                value={draftCalls}
                                                onChange={(event) => {
                                                    const value = event.target.valueAsNumber
                                                    if (Number.isSafeInteger(value) && value <= 2147483647) setDraftCalls(Math.max(freeConcurrentCalls, value))
                                                }}
                                                className="h-full min-w-0 flex-1 bg-transparent text-center text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-full rounded-none border-l"
                                                aria-label="Increase concurrent calls"
                                                disabled={saving || draftCalls >= 2147483647}
                                                onClick={() => setDraftCalls((value) => value + 1)}
                                            >
                                                <PlusIcon aria-hidden="true" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Pricing</p>
                                        <p className="text-muted-foreground">
                                            ${pricePerAdditionalConcurrentCallPerMonth.toFixed(2)} per additional concurrent call per month
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Cost</p>
                                        <p aria-live="polite" className="text-muted-foreground tabular-nums">
                                            ${(Math.max(0, draftCalls - freeConcurrentCalls) * pricePerAdditionalConcurrentCallPerMonth).toFixed(2)}/month
                                        </p>
                                    </div>
                                </div>

                                <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
                                    Due now: ${(Math.max(0, draftCalls - concurrentCalls) * pricePerAdditionalConcurrentCallPerMonth).toFixed(2)}
                                </p>
                                <DialogFooter>
                                    <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
                                    <Button
                                        disabled={saving || draftCalls === concurrentCalls}
                                        onClick={save}
                                    >
                                        {saving ? "Saving…" : "Save"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
                        <h3 className="text-muted-foreground">Reserve Inbound Capacity</h3>
                        <p>Not Set</p>
                    </div>

                    <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                        <InfoIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        All inbound, outbound, and web calls share the full concurrent call limit.
                    </p>

                </div>

                <div className="space-y-1 rounded-xl border p-4">
                    <h2 className="text-sm text-muted-foreground">LLM Token Limit</h2>
                    <p className="text-xl font-medium tabular-nums">3000</p>
                </div>

                {telephonyLimits.map((limit) => (
                    <div
                        key={limit}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                    >
                        <div className="space-y-1">
                            <h2 className="text-sm text-muted-foreground">{limit}</h2>
                            <p className="text-xl font-medium tabular-nums">1</p>
                        </div>
                    </div>
                ))}
            </section>
        </main>
    )
}
