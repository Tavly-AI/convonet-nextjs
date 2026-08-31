import {
  BracesIcon,
  ClipboardIcon,
  EllipsisIcon,
  ListTreeIcon,
  PencilIcon,
  UserRoundIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"

export type PhoneNumberDisplay = {
  id: string
  name: string
  number: string
  provider: string
  inboundAgent: AgentSettings
  outboundAgent: AgentSettings
  addOns: AddOn[]
}

type AgentSettings = {
  title: string
  agentPlaceholder: string
  countryLabel: string
  webhook?: boolean
  fallback?: {
    label: string
    description: string
    placeholder: string
  }
}

type AddOn = {
  title: string
  description: string
  action: string
  variant?: "ghost" | "outline"
}

const phoneNumber: PhoneNumberDisplay = {
  id: "my-number",
  name: "my number",
  number: "+19786984651",
  provider: "Custom telephony",
  inboundAgent: {
    title: "Inbound Call Agent",
    agentPlaceholder: "None (disable inbound)",
    countryLabel: "Allowed Inbound Countries",
    webhook: true,
    fallback: {
      label: "Fallback Number",
      description:
        "When inbound call concurrency is reached and cannot free up after extended ringing, will fallback to this number. (Learn more)",
      placeholder: "+11234567890",
    },
  },
  outboundAgent: {
    title: "Outbound Call Agent",
    agentPlaceholder: "None (disable outbound)",
    countryLabel: "Allowed Outbound Countries",
  },
  addOns: [
    {
      title: "SMS",
      description: "The ability to send SMS",
      action: "Setup SMS Function",
    },
    {
      title: "Verified Phone Number",
      description: "Use this phone number after outbound verification.",
      action: "Configure",
      variant: "outline",
    },
    {
      title: "Branded Call",
      description: "Display your verified business name as the caller ID. ($0.1/outbound call - U.S. numbers only)",
      action: "Configure",
      variant: "outline",
    },
  ],
}


export function RightDisplay() {
  return (
    <Card className="gap-5 p-5">
      <CardHeader className="items-center px-0 md:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            {phoneNumber.name}
            <Button variant="ghost" size="icon-sm" aria-label="Rename phone number">
              <PencilIcon />
            </Button>
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-1">
            ID: {phoneNumber.number}
            <ClipboardIcon className="size-3.5" />
            <span>· Provider: {phoneNumber.provider}</span>
          </CardDescription>
        </div>

        <CardAction className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="hidden sm:inline-flex">
            <UserRoundIcon />
            Verify your identity to make outbound calls
          </Button>
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
        <AgentSettingsCard settings={phoneNumber.inboundAgent} />
        <AgentSettingsCard settings={phoneNumber.outboundAgent} />

        <section className="space-y-3">
          <h2 className="font-medium">Advanced Add-Ons</h2>
          {phoneNumber.addOns.map((addOn) => (
            <Card key={addOn.title} size="sm" className="gap-3 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{addOn.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {addOn.description}
                  </p>
                </div>
                <Button variant={addOn.variant ?? "ghost"}>
                  {addOn.action}
                  {addOn.variant !== "outline" && <ListTreeIcon />}
                </Button>
              </div>
            </Card>
          ))}
        </section>
      </CardContent>
    </Card>
  )
}

function AgentSettingsCard({ settings }: { settings: AgentSettings }) {
  return (
    <section className="space-y-2">
      <h2 className="font-medium">{settings.title}</h2>
      <Card size="sm" className="gap-4 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>Call Agent</Label>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BracesIcon className="size-4" />
              A/B Testing
              <Toggle size="sm" aria-label={`${settings.title} A/B testing`} />
            </div>
          </div>
          <Select>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder={settings.agentPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{settings.agentPlaceholder}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.webhook && (
          <Label className="font-normal text-muted-foreground">
            <Checkbox />
            Add an inbound webhook.
            <span>(Learn more).</span>
          </Label>
        )}

        <div className="space-y-2">
          <Label>{settings.countryLabel}</Label>
          <Select>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All countries allowed" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries allowed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.fallback && (
          <div className="space-y-2">
            <div>
              <Label>{settings.fallback.label}</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.fallback.description}
              </p>
            </div>
            <Input placeholder={settings.fallback.placeholder} />
          </div>
        )}
      </Card>
    </section>
  )
}
