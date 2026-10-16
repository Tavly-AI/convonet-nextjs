import { PhoneOutgoing } from "lucide-react"

import { BatchCallAbsoluteModal } from "./_components/batch-call-absolute-modal"
import { BatchCallTable } from "./_components/batch-call-table"

export default function BatchCallPage() {
  return (
    <main className="flex min-h-[calc(100svh-var(--header-height)-1rem)] flex-1 flex-col p-4 lg:p-6">
      <section className="flex flex-1 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground">
        <header className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-6">
          <h1 className="flex items-center gap-2.5 text-base font-medium">
            <PhoneOutgoing aria-hidden="true" className="size-5 text-muted-foreground" />
            Batch Call
          </h1>
          <BatchCallAbsoluteModal />
        </header>
        <BatchCallTable />
      </section>
    </main>
  )
}
