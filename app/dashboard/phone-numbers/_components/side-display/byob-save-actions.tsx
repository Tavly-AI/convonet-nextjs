"use client"

import { useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"

export function ByobSaveActions() {
  const { pending } = useFormStatus()

  // scuffed-logic for server-components
  // logic to close the byob-modal
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (pending) wasPending.current = true
    else if (wasPending.current) closeButtonRef.current?.click()
  }, [pending])

  return (
    <div className="flex items-center gap-2">
      <DialogClose render={<Button ref={closeButtonRef} variant="outline" disabled={pending} />}>
        Cancel
      </DialogClose>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  )
}
