import { Phone } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function BatchCallTable() {
  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border lg:mx-6 lg:mb-6">
      <Table aria-label="Batch calls">
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 pl-4">Batch Call Name</TableHead>
            <TableHead>From Number</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead className="pr-4">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="h-56 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Phone aria-hidden="true" className="size-5" />
                </span>
                <p className="font-medium">No batch calls yet</p>
                <p className="whitespace-normal text-sm text-muted-foreground">
                  Create your first batch call to see it here.
                </p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
