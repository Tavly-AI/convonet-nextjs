import Link from "next/link"
import { Suspense } from "react"
import { PhoneIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { type PhoneNumberWithConfig } from "../_lib/phone-number-config-actions"
import { VerificationModal } from "./side-display/verification-modal"
import { UserPhoneNumbersList } from "./side-display/user-phone-numbers-list"

export function LeftSidebar({ phoneNumberId, phoneNumbers }: { phoneNumberId?: string, phoneNumbers: PhoneNumberWithConfig[] }) {

  const selectedPhoneNumberId =
    phoneNumbers.some((phoneNumber) => phoneNumber.id === phoneNumberId)
      ? phoneNumberId
      : phoneNumbers[0]?.id

  return (
    <Card className="gap-4 p-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneIcon className="size-4 text-muted-foreground" />
          Phone Numbers
        </CardTitle>
        <CardAction>
          <Suspense
            fallback={
              <Button size="icon-lg" aria-label="Add phone number" disabled>
                <PlusIcon className="size-5" />
              </Button>
            }
          >
            <VerificationModal />
          </Suspense>
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="flex flex-col gap-4 px-0">
        <Suspense fallback={null}>
          <UserPhoneNumbersList phoneNumbers={phoneNumbers} />
        </Suspense>
      </CardContent>
    </Card>
  )
}