import { redirect } from "next/navigation"

import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
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

import { BuyNumberModal } from "../number-modal/buy-number-modal"
import { getOrCreateTelnyxManagedAccount } from "../../_lib/telnyx-subaccount-trunk"
import { getOrCreateTelnyxSipTrunk } from "../../_lib/telnyx-setup-sip-trunk"
import { getOrCreateTwilioSubaccount } from "../../_lib/twillio-subaccount"
import { getOrCreateTwilioSipTrunk } from "../../_lib/twillio-setup-sip-trunk"

export async function VerificationModal() {
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

  const twilioSubaccount = await getOrCreateTwilioSubaccount(
    user.workspace.id,
    `${user.workspace.name} Twilio subaccount`
  )

  await getOrCreateTwilioSipTrunk({
    workspaceId: user.workspace.id,
    subaccountSid: twilioSubaccount.sid,
    subaccountAuthToken: twilioSubaccount.authToken,
  })

  const telnyxManagedAccount = await getOrCreateTelnyxManagedAccount(user.workspace.id)

  await getOrCreateTelnyxSipTrunk({
    workspaceId: user.workspace.id,
    managedAccount: telnyxManagedAccount,
  })

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className="rounded-b-none" />}>
        Buy Number
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
