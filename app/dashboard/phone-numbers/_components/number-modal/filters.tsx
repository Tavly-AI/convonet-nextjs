// optimize file
"use client"

import { FormEvent, useState } from "react"
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

export type NumberSearchFilters = {
  country: string
  search: string
}

function getTwilioSearchUrl({ country, search }: NumberSearchFilters) {
  const params = new URLSearchParams({ country })
  const searchTerm = search.trim()

  if (searchTerm) params.set("search", searchTerm)

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

  async function searchNumbers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchStart()

    try {
      const response = await fetch(getTwilioSearchUrl({ country, search }))
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

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="border-ring">
          <CheckIcon />
          Standard ($2/month)
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Toll-free ($5/month)
        </Button>
      </div>

    </>
  )
}
