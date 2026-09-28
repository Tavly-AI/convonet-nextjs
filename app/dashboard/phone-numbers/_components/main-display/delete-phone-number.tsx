"use client"

import { type ReactNode, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deletePhoneNumber } from "@/app/dashboard/phone-numbers/_lib/delete-phone-number"
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function DeletePhoneNumber({
  phoneNumberId,
  phoneNumber,
  children,
}: {
  phoneNumberId: string
  phoneNumber: string
  children: ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function releaseNumber() {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("phoneNumberId", phoneNumberId)
        await deletePhoneNumber(formData)
        toast.success("Phone number removed.")
        router.replace("/dashboard/phone-numbers")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove phone number.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children}
      <DialogContent className="max-w-md p-0" showCloseButton={!isPending}>
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Release phone number?</DialogTitle>
          <DialogDescription>
            This removes {phoneNumber} from your workspace and LiveKit routing. Your carrier number will remain active.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t px-5 py-4">
          <DialogClose render={<Button variant="outline" disabled={isPending} />}>Cancel</DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={releaseNumber}>
            {isPending ? "Removing..." : "Release number"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DeletePhoneNumberTrigger() {
  return (
    <DialogTrigger render={<DropdownMenuItem variant="destructive" />}>
      Delete number
    </DialogTrigger>
  )
}
