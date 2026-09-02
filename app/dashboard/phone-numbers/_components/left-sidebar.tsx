import { Suspense } from "react"
import { PhoneIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { SetupByobModal } from "./side-display/setup-byob-modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function LeftSidebar({ phoneNumbers }: { phoneNumbers: PhoneNumberWithConfig[] }) {
  return (
    <Card className="gap-4 p-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <PhoneIcon className="size-4 text-muted-foreground" />
          Phone Numbers
        </CardTitle>
        <CardAction>
          <ChooseButton />
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

function ChooseButton() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button size="icon-lg" aria-label="Add phone number" />
        }
      >
        <PlusIcon className="size-5" />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-48 rounded-2xl">
        <div className="flex flex-col gap-2">
          <Suspense
            fallback={
              <Button variant="outline" disabled>
                Buy Number
              </Button>
            }
          >
            <VerificationModal />
          </Suspense>

          <SetupByobModal />
        </div>
      </PopoverContent>
    </Popover>
  )
}