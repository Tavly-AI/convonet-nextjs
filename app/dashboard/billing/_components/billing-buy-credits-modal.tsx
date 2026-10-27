"use client"

import { useState, type FormEvent } from "react"
import { CircleDollarSign } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { BILLING_GLOBAL_CONFIG_VALUES } from "../_lib/payment-config"
import { billingCreateStripCheckout } from "../_actions/billing-stripe-checkout-actions"

const MINIMUM_RECHARGE = BILLING_GLOBAL_CONFIG_VALUES.config.minimumRecharge

export function BillingBuyCreditsModal() {
    const [amount, setAmount] = useState(String(MINIMUM_RECHARGE))
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleCheckout(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setIsLoading(true)
        setError("")

        try {
            window.location.assign(await billingCreateStripCheckout(amount))
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not open checkout")
            setIsLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger
                render={
                    <Button
                        variant="outline"
                        className="font-normal text-muted-foreground"
                    />
                }
            >
                <CircleDollarSign />
                Buy credits
            </DialogTrigger>

            <DialogContent className="max-w-sm p-6">
                <DialogHeader>
                    <DialogTitle>Buy credits</DialogTitle>
                    <DialogDescription>
                        Add any amount from ${MINIMUM_RECHARGE}.
                        Pay securely with Stripe.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCheckout} className="mt-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="top-up-amount">Amount (USD)</Label>

                        <Input
                            id="top-up-amount"
                            type="number"
                            min={MINIMUM_RECHARGE}
                            step="0.01"
                            required
                            value={amount}
                            disabled={isLoading}
                            onChange={(event) => setAmount(event.target.value)}
                            className="text-center"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Opening checkout..." : "Continue to payment"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}