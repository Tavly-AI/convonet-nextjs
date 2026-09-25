"use client"

import { useFormStatus } from "react-dom"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"

export function ByobSaveActions() {
  const { pending } = useFormStatus()

  return (
    <div className="flex items-center gap-2">
      {pending && (
        <span aria-live="polite" className="text-sm text-muted-foreground">
          Saving…
        </span>
      )}
      <DialogClose render={<Button variant="outline" disabled={pending} />}>
        Cancel
      </DialogClose>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  )
}
