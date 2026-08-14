"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  SECONDARY_TABS,
  type SecondaryTabId,
} from "@/app/agents/_lib/secondary-tab-manager"

export function AgentSessionTabSecondary() {
  const [openTab, setOpenTab] = React.useState<SecondaryTabId | null>(null)

  return (
    <Card className="min-h-96 gap-0 py-0">
      <div className="divide-y px-4">
        {SECONDARY_TABS.map((tab) => {
          const { id, label, icon: Icon } = tab
          const Content = "content" in tab ? tab.content : null
          const open = openTab === id

          return (
            <div key={id}>
              <button
                type="button"
                className="flex min-h-16 w-full items-center gap-3 px-1 py-4 text-left"
                aria-expanded={Content ? open : undefined}
                onClick={() => Content && setOpenTab(open ? null : id)}
              >
                <Icon className="size-5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{label}</span>
                <ChevronDownIcon
                  className={cn(
                    "ml-auto size-4 shrink-0 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>
              {open && Content && <Content />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
