import { Suspense } from "react"

import { WebsiteCustomLoader } from "@/components/custom/website-custom-loader"
import { Card } from "@/components/ui/card"

import { LeftSidebar } from "./_components/left-sidebar"
import { RightDisplay } from "./_components/right-display"
import { getPhoneNumbers } from "./_lib/phone-number-config-actions"

export default async function Page({ searchParams }: { searchParams?: Promise<{ phoneNumberId?: string }> }) {
  // resolve the params
  const resolvedSearchParams = await searchParams
  const phoneNumberId = resolvedSearchParams?.phoneNumberId

  return (
    <main className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="grid min-h-[calc(100vh-var(--header-height)-3rem)] gap-4 lg:grid-cols-[400px_1fr]">
        <Suspense fallback={<PhoneNumbersSidebarLoading />}>
          <PhoneNumbersSidebar phoneNumberId={phoneNumberId} />
        </Suspense>
        <Suspense
          key={phoneNumberId ?? "default"}
          fallback={<PhoneNumberDetailsLoading />}
        >
          <RightDisplay phoneNumberId={phoneNumberId} />
        </Suspense>
      </div>
    </main>
  )
}

async function PhoneNumbersSidebar({ phoneNumberId, }: { phoneNumberId?: string }) {
  const phoneNumbers = await getPhoneNumbers()
  return (
    <LeftSidebar phoneNumberId={phoneNumberId} phoneNumbers={phoneNumbers} />
  )
}

function PhoneNumbersSidebarLoading() {
  return (
    <Card className="min-h-[60vh] gap-5 p-5">
      <div className="flex flex-1 items-center justify-center">
        <WebsiteCustomLoader
          title="Loading phone numbers"
          detail="Fetching sidebar..."
        />
      </div>
    </Card>
  )
}

function PhoneNumberDetailsLoading() {
  return (
    <Card className="min-h-[60vh] gap-5 p-5">
      <div className="flex flex-1 items-center justify-center">
        <WebsiteCustomLoader
          title="Loading phone number"
          detail="Fetching configuration..."
        />
      </div>
    </Card>
  )
}
