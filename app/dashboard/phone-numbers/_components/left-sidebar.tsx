"use client"

import { useState } from "react"
import { PhoneIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { BuyNumberModal } from "./number-modal/buy-number-modal"

export type PhoneNumberListItem = {
  id: string
  name: string
}

const phoneNumbers: PhoneNumberListItem[] = [
  { id: "my-number", name: "my number" },
  { id: "outbound-trunk-2", name: "My outbound trunk 2" },
]

export function LeftSidebar() {
  const selectedPhoneNumberId = phoneNumbers[0].id

  return (
    <Card className="gap-4 p-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneIcon className="size-4 text-muted-foreground" />
          Phone Numbers
        </CardTitle>
        <CardAction>
          <VerificationModal />
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-4 px-0">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search phone numbers"
            aria-label="Search phone numbers"
          />
        </div>

        <div className="flex flex-col gap-1">
          {phoneNumbers.map((phoneNumber) => (
            <Button
              key={phoneNumber.id}
              variant={
                phoneNumber.id === selectedPhoneNumberId ? "secondary" : "ghost"
              }
              className="h-10 justify-start px-3 text-left"
            >
              {phoneNumber.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function VerificationModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="icon-lg" aria-label="Add phone number" />}
      >
        <PlusIcon className="size-5" />
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Complete verification</DialogTitle>
          <DialogDescription>
            Complete verification before using purchased numbers for outbound calls.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-4 text-sm text-muted-foreground">
          Continue when your verification is complete.
        </div>
        <DialogFooter className="border-t px-5 py-4 sm:justify-between">
          <DialogClose render={<BuyNumberModal />} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
