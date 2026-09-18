"use client"

import { PhoneCallIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { startOutboundTestCall } from "@/app/dashboard/phone-numbers/_lib/outbound-call-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OutboundCallMaker({ phoneNumberId }: { phoneNumberId: string }) {
  const [destinationNumber, setDestinationNumber] = useState("")
  const [isPending, startTransition] = useTransition()

  function startCall() {
    startTransition(async () => {
      try {
        const call = await startOutboundTestCall({
          phoneNumberId,
          destinationNumber,
        })
        toast.success(`Call connected. Room: ${call.roomName}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to start test call.")
      }
    })
  }

  return (
    <section className="space-y-2">
      <h2 className="font-medium">Test Outbound Call</h2>
      <Card size="sm" className="gap-4 p-4">
        <div className="space-y-2">
          <Label htmlFor="outbound-test-destination">Destination number</Label>
          <Input
            id="outbound-test-destination"
            type="tel"
            value={destinationNumber}
            onChange={(event) => setDestinationNumber(event.target.value)}
            placeholder="+14155550123"
          />
          <p className="text-sm text-muted-foreground">
            The saved outbound agent will place a call using this phone number as the caller ID.
          </p>
        </div>
        <div className="flex justify-end">
          <Button type="button" disabled={isPending || !destinationNumber.trim()} onClick={startCall}>
            <PhoneCallIcon />
            {isPending ? "Calling…" : "Test call"}
          </Button>
        </div>
      </Card>
    </section>
  )
}
