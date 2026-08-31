import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

import { LeftSidebar } from "./_components/left-sidebar"
import { getOrCreateTwilioSubaccount } from "./_lib/twillio-subaccount"
import { RightDisplay } from "./_components/right-display"
import { getOrCreateTwilioSipTrunk } from "./_lib/twillio-setup-sip-trunk"

export default async function Page() {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!user?.workspace) redirect("/auth/login")

  // switch to the verification
  const twilioSubaccount = await getOrCreateTwilioSubaccount(
    user.workspace.id,
    `${user.workspace.name} Twilio subaccount`
  )

  await getOrCreateTwilioSipTrunk({
    workspaceId: user.workspace.id,
    subaccountSid: twilioSubaccount.sid,
    subaccountAuthToken: twilioSubaccount.authToken,
  })

  return (
    <main className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="grid min-h-[calc(100vh-var(--header-height)-3rem)] gap-4 lg:grid-cols-[400px_1fr]">
        <LeftSidebar />
        <RightDisplay />
      </div>
    </main>
  )
}
