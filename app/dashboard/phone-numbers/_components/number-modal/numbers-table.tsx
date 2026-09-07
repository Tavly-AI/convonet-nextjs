"use client"

import { useState } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { WebsiteCustomLoader } from "@/components/custom/website-custom-loader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buyNumber } from "./buy-number-class"

export type AvailableNumber = {
  phoneNumber: string
  friendlyName: string | null
  locality: string | null
  region: string | null
  postalCode: string | null
  capabilities: Record<string, boolean>
}

function getNumberLocation(number: AvailableNumber) {
  return (
    [number.locality, number.region].filter(Boolean).join(", ") ||
    number.friendlyName ||
    "-"
  )
}

function getEmptyStateText(isSearching: boolean, searched: boolean) {
  if (isSearching) return "Searching numbers..."
  if (searched) return "No numbers found."

  return "Search for a number to see available results."
}

export function NumbersTable({
  numbers,
  searched,
  isSearching,
}: {
  numbers: AvailableNumber[]
  searched: boolean
  isSearching: boolean
}) {
  const [isBuying, setIsBuying] = useState(false)

  async function handleBuyNumber(phoneNumber: string) {
    if (isBuying) return
    setIsBuying(true)

    try {
      await buyNumber(phoneNumber)
    } finally {
      setIsBuying(false)
    }
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border">
      {isBuying ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-[1px]">
          <WebsiteCustomLoader title="Purchasing phone number" />
        </div>
      ) : null}
      <div className="h-full overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Phone number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Capabilities</TableHead>
              <TableHead className="w-20 text-right">
                <span className="sr-only">Buy</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {numbers.map((number) => (
              <TableRow key={number.phoneNumber}>
                <TableCell className="pl-4 font-medium">
                  {number.phoneNumber}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getNumberLocation(number)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {number.capabilities.voice && (
                      <Badge variant="secondary">Voice</Badge>
                    )}
                    {number.capabilities.SMS && (
                      <Badge variant="outline">SMS</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <Button
                    size="sm"
                    disabled={isBuying}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleBuyNumber(number.phoneNumber)
                    }}
                  >
                    Buy
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {!numbers.length && (
              <TableRow>
                <TableCell colSpan={4} className="h-72 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                    {isSearching ? (
                      <Loader2Icon className="size-5 animate-spin" />
                    ) : (
                      <SearchIcon className="size-5" />
                    )}
                    <p>{getEmptyStateText(isSearching, searched)}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
