"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  saveInboundPhoneNumberConfig,
  saveOutboundPhoneNumberConfig,
  savePhoneNumberNickname,
} from "@/app/dashboard/phone-numbers/_lib/phone-number-config-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CountriesDropdown } from "./countries-dropdown"

type PhoneNumberFormProps = {
  phoneNumberId: string
  nickname: string
  inboundAgentId: string
  outboundAgentId: string
  allowedInboundCountries: string
  allowedOutboundCountries: string
  inboundWebhookUrl: string
  fallbackNumber: string
  agents: {
    id: string
    name: string
  }[]
}

type AgentSettingsCardProps = {
  phoneNumberId: string
  type: "inbound" | "outbound"
  initialSelectedAgentId: string
  countryLabel: string
  initialCountriesValue: string
  agents: {
    id: string
    name: string
  }[]
  initialWebhookEnabled?: boolean
  initialWebhookUrl?: string
  initialFallbackNumber?: string
}

export function PhoneNumberForm({
  phoneNumberId,
  nickname: initialNickname,
  inboundAgentId: initialInboundAgentId,
  outboundAgentId: initialOutboundAgentId,
  allowedInboundCountries: initialAllowedInboundCountries,
  allowedOutboundCountries: initialAllowedOutboundCountries,
  inboundWebhookUrl: initialInboundWebhookUrl,
  fallbackNumber: initialFallbackNumber,
  agents,
}: PhoneNumberFormProps) {
  const [isPending, startTransition] = useTransition()

  const [nickname, setNickname] = useState(initialNickname)

  function saveNickname() {
    startTransition(async () => {
      try {
        await savePhoneNumberNickname({
          phoneNumberId,
          nickname,
        })
        toast.success("Phone number updated.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update phone number.")
      }
    })
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h2 className="font-medium">General</h2>
        <Card size="sm" className="gap-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number-nickname">Nickname</Label>
            <Input
              id="phone-number-nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Frontdesk Number"
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" disabled={isPending} onClick={saveNickname}>
              Save
            </Button>
          </div>
        </Card>
      </section>

      {[
        {
          key: "inbound" as const,
          type: "inbound" as const,
          title: "Inbound Call Agent",
          initialSelectedAgentId: initialInboundAgentId,
          countryLabel: "Allowed Inbound Countries",
          initialCountriesValue: initialAllowedInboundCountries,
          initialWebhookEnabled: Boolean(initialInboundWebhookUrl),
          initialWebhookUrl: initialInboundWebhookUrl,
          initialFallbackNumber: initialFallbackNumber,
        },
        {
          key: "outbound" as const,
          type: "outbound" as const,
          title: "Outbound Call Agent",
          countryLabel: "Allowed Outbound Countries",
          initialSelectedAgentId: initialOutboundAgentId,
          initialCountriesValue: initialAllowedOutboundCountries,
        },
      ].map((section) => (
        <AgentSettingsCard
          key={section.key}
          phoneNumberId={phoneNumberId}
          type={section.type}
          initialSelectedAgentId={section.initialSelectedAgentId}
          countryLabel={section.countryLabel}
          initialCountriesValue={section.initialCountriesValue}
          agents={agents}
          initialWebhookEnabled={section.initialWebhookEnabled}
          initialWebhookUrl={section.initialWebhookUrl}
          initialFallbackNumber={section.initialFallbackNumber}
        />
      ))}
    </div>
  )
}

function AgentSettingsCard({
  phoneNumberId,
  type,
  initialSelectedAgentId,
  countryLabel,
  initialCountriesValue,
  agents,
  initialWebhookEnabled,
  initialWebhookUrl,
  initialFallbackNumber,
}: AgentSettingsCardProps) {
  const [isPending, startTransition] = useTransition()

  const [selectedAgentId, setSelectedAgentId] = useState(initialSelectedAgentId || "none")
  const [countriesValue, setCountriesValue] = useState(initialCountriesValue)
  const [webhookEnabled, setWebhookEnabled] = useState(Boolean(initialWebhookEnabled))
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl ?? "")
  const [fallbackNumber, setFallbackNumber] = useState(initialFallbackNumber ?? "")
  const title = type === "inbound" ? "Inbound Call Agent" : "Outbound Call Agent"

  function saveInbound() {
    startTransition(async () => {
      try {
        await saveInboundPhoneNumberConfig({
          phoneNumberId,
          inboundAgentId: selectedAgentId === "none" ? "" : selectedAgentId,
          allowedInboundCountries: countriesValue,
          inboundWebhookUrl: webhookEnabled ? webhookUrl : "",
          fallbackNumber,
        })
        toast.success("Phone number updated.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update phone number.")
      }
    })
  }

  function saveOutbound() {
    startTransition(async () => {
      try {
        await saveOutboundPhoneNumberConfig({
          phoneNumberId,
          outboundAgentId: selectedAgentId === "none" ? "" : selectedAgentId,
          allowedOutboundCountries: countriesValue,
        })
        toast.success("Phone number updated.")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update phone number.")
      }
    })
  }

  return (
    <section className="space-y-2">
      <h2 className="font-medium">{title}</h2>
      <Card size="sm" className="gap-4 p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Call Agent</Label>
            <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value ?? "none")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {initialWebhookEnabled !== undefined && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-normal text-muted-foreground">
                <Checkbox
                  checked={webhookEnabled}
                  onCheckedChange={(value) => setWebhookEnabled(!!value)}
                />
                Add an inbound webhook.
              </Label>
              {webhookEnabled && (
                <Input
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://example.com/inbound-webhook"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>{countryLabel}</Label>
            <CountriesDropdown
              key={selectedAgentId}
              value={countriesValue}
              onChange={setCountriesValue}
            />
          </div>

          {initialFallbackNumber !== undefined && (
            <div className="space-y-2">
              <div>
                <Label>Fallback Number</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  When inbound call concurrency is reached and cannot free up after extended ringing, fallback calls route here.
                </p>
              </div>
              <Input
                value={fallbackNumber}
                onChange={(event) => setFallbackNumber(event.target.value)}
                placeholder="+11234567890"
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              disabled={isPending}
              onClick={type === "inbound" ? saveInbound : saveOutbound}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>
    </section>
  )
}
