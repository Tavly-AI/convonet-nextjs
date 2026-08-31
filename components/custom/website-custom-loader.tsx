"use client"

import { COMPANY_LOGO } from "@/lib/constants"

export function WebsiteCustomLoader({
  title = "Loading",
  detail,
}: {
  title?: string
  detail?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-muted/40" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
        <div
          className="text-primary [&_svg]:size-9"
          dangerouslySetInnerHTML={{ __html: COMPANY_LOGO }}
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {detail ? (
          <p className="text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  )
}
