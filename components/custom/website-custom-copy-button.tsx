"use client"

import { useState } from "react"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function WebsiteCustomCopyButton({
  value,
  label = "ID",
  className,
}: {
  value: string
  label?: string
  className?: string
}) {
  const [copying, setCopying] = useState(false)

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={className}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      disabled={!value || copying}
      onClick={async (event) => {
        event.stopPropagation()
        setCopying(true)
        try {
          await navigator.clipboard.writeText(value)
          toast.success(`${label} copied`)
        } catch {
          toast.error(`Could not copy ${label}. Please try again.`)
        } finally {
          setCopying(false)
        }
      }}
    >
      <CopyIcon aria-hidden="true" />
    </Button>
  )
}
