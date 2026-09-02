// optimize file
"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import {
  CheckIcon,
  Loader2Icon,
  SearchIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AvailableNumber } from "./numbers-table"

const providers = [
  { value: "twilio", label: "Twilio", disabled: false },
  { value: "telnyx", label: "Telnyx", disabled: true },
]

const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
]

type NumberType = "standard" | "toll-free"

export type NumberSearchFilters = {
  country: string
  search: string
  type: NumberType
}

function getTwilioSearchUrl({ country, search, type }: NumberSearchFilters) {
  const params = new URLSearchParams({ country })
  const searchTerm = search.trim()

  if (searchTerm) params.set("search", searchTerm)
  params.set("type", type)

  return `/api/twillio/search-number?${params.toString()}`
}

export function NumberModalFilters({
  isSearching,
  onSearchStart,
  onSearchComplete,
}: {
  isSearching: boolean
  onSearchStart: () => void
  onSearchComplete: (numbers: AvailableNumber[]) => void
}) {
  const [country, setCountry] = useState(countries[0].value)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<NumberType>("standard")

  async function searchNumbers(event?: FormEvent<HTMLFormElement>, nextType?: NumberType) {
    event?.preventDefault()

    const filters: NumberSearchFilters = { country, search, type: nextType ?? type }

    onSearchStart()

    try {
      const response = await fetch(getTwilioSearchUrl(filters))
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to search phone numbers.")
      }

      onSearchComplete(data)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to search phone numbers."
      )
      onSearchComplete([])
    }
  }

  async function handleTypeChange(nextType: NumberType) {
    if (isSearching) return

    setType(nextType)
    await searchNumbers(undefined, nextType)
  }

  return (
    <>
      <Tabs value="twilio">
        <TabsList className="grid h-8 w-full grid-cols-2">
          {providers.map((provider) => (
            <TabsTrigger
              key={provider.value}
              value={provider.value}
              disabled={provider.disabled}
            >
              {provider.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <form onSubmit={searchNumbers} className="grid gap-3 md:grid-cols-2">
        <Select
          value={country}
          onValueChange={(value) => {
            if (value) setCountry(value)
          }}
        >
          <SelectTrigger className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countries.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-8"
              placeholder="Search numbers e.g. 650"
            />
          </div>
          <Button type="submit" className="h-10" disabled={isSearching}>
            {isSearching && <Loader2Icon className="animate-spin" />}
            Search
          </Button>
        </div>
      </form>

      <TypeButtons type={type} onTypeChange={handleTypeChange} />
    </>
  )
}

// MISC CODE
const numberTypes = [
  {
    value: "standard",
    label: "Standard ($2/month)",
  },
  {
    value: "toll-free",
    label: "Toll-free ($5/month)",
  },
] as const

function TypeButtons({ type, onTypeChange, }: { type: NumberType; onTypeChange: (type: NumberType) => void }) {
  return (
    <div className="flex items-center gap-2">
      {numberTypes.map((item) => (
        <Button
          key={item.value}
          type="button"
          variant={type === item.value ? "outline" : "ghost"}
          size="sm"
          className={type === item.value ? "border-ring" : undefined}
          onClick={() => onTypeChange(item.value)}
        >
          {type === item.value && <CheckIcon />}
          {item.label}
        </Button>
      ))}
    </div>
  )
}