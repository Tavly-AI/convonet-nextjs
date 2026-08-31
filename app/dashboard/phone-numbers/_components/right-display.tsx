import {
  ClipboardIcon,
  EllipsisIcon,
  UserRoundIcon,
} from "lucide-react"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { PhoneNumberForm } from "./main-display/phone-number-form"

export async function RightDisplay({
  phoneNumberId,
}: {
  phoneNumberId?: string
}) {
  const workspaceId = await getCurrentWorkspaceId()
  const agents = await prisma.agent.findMany({
    where: {
      workspaceId,
      channel: "voice",
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  })

  let phoneNumber = phoneNumberId
    ? await prisma.twilioPhoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        workspaceId,
      },
      include: { config: true },
    })
    : null

  if (!phoneNumber) {
    phoneNumber = await prisma.twilioPhoneNumber.findFirst({
      where: { workspaceId },
      include: { config: true },
      orderBy: { createdAt: "asc" },
    })
  }

  if (!phoneNumber) {
    return (
      <Card className="gap-5 p-5">
        <CardHeader className="px-0">
          <CardTitle className="text-xl">Phone Numbers</CardTitle>
          <CardDescription>
            Buy a number to configure inbound and outbound call routing.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const name = phoneNumber.config?.nickname?.trim() || phoneNumber.phoneNumber

  return (
    <Card className="gap-5 p-5">
      <CardHeader className="items-center px-0 md:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            {name}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-1">
            ID: {phoneNumber.phoneNumber}
            <ClipboardIcon className="size-3.5" />
            <span>· Provider: Twilio</span>
          </CardDescription>
        </div>

        <CardAction className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Phone number actions"
                />
              }
            >
              <EllipsisIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Release number</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-5 px-0">
        <PhoneNumberForm
          phoneNumberId={phoneNumber.id}
          nickname={phoneNumber.config?.nickname ?? ""}
          inboundAgentId={readAgentId(phoneNumber.config?.inboundAgents)}
          outboundAgentId={readAgentId(phoneNumber.config?.outboundAgents)}
          allowedInboundCountries={readCountryList(phoneNumber.config?.allowedInboundCountryList)}
          allowedOutboundCountries={readCountryList(phoneNumber.config?.allowedOutboundCountryList)}
          inboundWebhookUrl={phoneNumber.config?.inboundWebhookUrl ?? ""}
          fallbackNumber={phoneNumber.config?.fallbackNumber ?? ""}
          agents={agents}
        />


        <AdvanceAddOnsUI />
      </CardContent>
    </Card>
  )
}


function AdvanceAddOnsUI() {
  return (
    <section className="space-y-3">
      <h2 className="font-medium">Advanced Add-Ons</h2>
      <Card size="sm" className="gap-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">SMS</p>
            <p className="text-sm text-muted-foreground">
              The ability to send SMS
            </p>
          </div>
          <Button variant="ghost">Setup SMS Function</Button>
        </div>
      </Card>
      <Card size="sm" className="gap-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Verified Phone Number</p>
            <p className="text-sm text-muted-foreground">
              Use this phone number after outbound verification.
            </p>
          </div>
          <Button variant="outline">Configure</Button>
        </div>
      </Card>
      <Card size="sm" className="gap-3 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium">Branded Call</p>
            <p className="text-sm text-muted-foreground">
              Display your verified business name as the caller ID. ($0.1/outbound call - U.S. numbers only)
            </p>
          </div>
          <Button variant="outline">Configure</Button>
        </div>
      </Card>
    </section>
  )
}

// MISC CODE

function readAgentId(value: unknown) {
  if (!Array.isArray(value)) return ""

  const agent = value[0]
  if (!agent || typeof agent !== "object" || !("agent_id" in agent)) return ""

  return typeof agent.agent_id === "string" ? agent.agent_id : ""
}

function readCountryList(value: unknown) {
  if (!Array.isArray(value)) return ""

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .join(", ")
}