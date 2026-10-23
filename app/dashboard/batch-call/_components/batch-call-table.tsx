import { Phone } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { batchCall_DB_list } from "../_actions/batch-call-db-actions"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export async function BatchCallTable() {
  const { batches, now } = await batchCall_DB_list()
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  })

  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border lg:mx-6 lg:mb-6">
      <Table aria-label="Batch calls">
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-12 pl-4">Batch Call Name</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Scheduled Start (UTC)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length ? batches.map(batch => {
            const total = batch.tasks.length
            const status = resolveStatus(batch.tasks, batch.trigger_timestamp, now)

            return (
              <TableRow key={batch.id}>
                <TableCell className="pl-4">
                  <p className="font-medium">{batch.name?.trim() || "Untitled batch"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Created {dateFormat.format(batch.createdAt)} UTC</p>
                </TableCell>
                <TableCell>{batch.fromPhoneNumber.phoneNumber}</TableCell>
                <TableCell>
                  <p>{total}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {batch.tasks.filter(task => task.workerTaskStatus === "completed").length} completed · {batch.tasks.filter(task => task.workerTaskStatus === "failed").length} failed
                  </p>
                </TableCell>
                <TableCell>{batch.trigger_timestamp === null ? "—" : dateFormat.format(Number(batch.trigger_timestamp))}</TableCell>
                <TableCell>
                  <Badge variant={status === "Failed" || status === "Completed with errors" ? "destructive" : "secondary"}>
                    {status}
                  </Badge>
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <ViewBatchCalls batchId={batch.id} batchName={batch.name} />
                </TableCell>
              </TableRow>
            )
          }) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="h-56 text-center">
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
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function resolveStatus(
  tasks: { workerTaskStatus: string }[],
  triggerTimestamp: number | bigint | null,
  now: number
) {
  const total = tasks.length
  const completed = tasks.filter(task => task.workerTaskStatus === "completed").length
  const failed = tasks.filter(task => task.workerTaskStatus === "failed").length
  const processing = tasks.some(task => task.workerTaskStatus === "processing")

  const allFinished = total > 0 && completed + failed === total
  const hasStarted = completed > 0 || failed > 0 || processing
  const isScheduled = triggerTimestamp !== null && Number(triggerTimestamp) > now

  if (allFinished) {
    if (failed === total) return "Failed"
    if (failed > 0) return "Completed with errors"
    return "Completed"
  }

  if (hasStarted) return "Processing"
  if (isScheduled) return "Scheduled"

  return "Pending"
}

export function ViewBatchCalls({ batchId, batchName }: { batchId: string; batchName?: string | null }) {
  return (
    <Link
      href={{ pathname: "/dashboard/call-history", query: { batchCallId: batchId } }}
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      aria-label={`View calls for ${batchName?.trim() || "Untitled batch"}`}
    >
      View calls
    </Link>
  )
}