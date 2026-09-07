// optimize file
"use client"

import { useState } from "react"

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
import {
  NumberModalFilters,
} from "./filters"
import { NumbersTable, type AvailableNumber } from "./numbers-table"

export function BuyNumberModal() {
  const [numbers, setNumbers] = useState<AvailableNumber[]>([])
  const [searched, setSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  function handleSearchStart() {
    setIsSearching(true)
    setSearched(true)
  }

  function handleSearchComplete(nextNumbers: AvailableNumber[]) {
    setNumbers(nextNumbers)
    setIsSearching(false)
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        Continue
      </DialogTrigger>
      <DialogContent className="flex h-[min(680px,90svh)] max-w-2xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 py-4">
          <DialogTitle>Buy Phone Number</DialogTitle>
          <DialogDescription className="sr-only">
            Search Twilio numbers available for voice calling.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4">
          <NumberModalFilters
            isSearching={isSearching}
            onSearchStart={handleSearchStart}
            onSearchComplete={handleSearchComplete}
          />

          <NumbersTable
            numbers={numbers}
            searched={searched}
            isSearching={isSearching}
          />

          <div className="rounded-b-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <span>{searched ? `${numbers.length} results` : "Search to see results"}</span>
          </div>
        </div>

        <DialogFooter className="shrink-0 items-center justify-end border-t px-5 py-4 sm:justify-end">
          <div className="flex gap-2">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
