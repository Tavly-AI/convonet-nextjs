"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import type { PhoneNumberWithConfig } from "@/app/dashboard/phone-numbers/_lib/phone-number-config-actions"
import { ChevronLeft, Download, Phone, UploadCloud, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BATCH_CALL_TOTAL_CONCURRENCY, type BatchCallGlobalType } from "../_lib/batch-call-global-types"


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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"
import { batchCall_DB_create } from "../_actions/batch-call-db-actions"
import { batchCallParseFile } from "../_lib/batch-call-parse-files"

export function BatchCallAbsoluteModalClient({ phoneNumbers, availableWorkspaceConcurrency }: { phoneNumbers: PhoneNumberWithConfig[]; availableWorkspaceConcurrency: number }) {
    const [batchCallTasks, setTasks] = useState<BatchCallGlobalType["task"][]>([])
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (nextOpen) setTasks([]); setOpen(nextOpen) }}>
            <DialogTrigger render={<Button />}>
                Create a batch call
            </DialogTrigger>
            <DialogContent className="inset-0 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 p-0 data-ending-style:scale-100 data-starting-style:scale-100">
                <DialogHeader className="shrink-0 flex-row items-center gap-4 border-b bg-card px-6 py-4 pr-14">
                    <DialogClose render={<Button variant="outline" size="icon" aria-label="Back to batch calls" />}>
                        <ChevronLeft aria-hidden="true" />
                    </DialogClose>
                    <div className="space-y-1">
                        <DialogTitle>Create a batch call</DialogTitle>
                        <DialogDescription>Set up your outbound call and add your recipients.</DialogDescription>
                    </div>
                </DialogHeader>
                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[400px_1fr]">
                    <LeftSideForm phoneNumbers={phoneNumbers} batchCallTasks={batchCallTasks} setTasks={setTasks} onClose={() => setOpen(false)} isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} availableWorkspaceConcurrency={availableWorkspaceConcurrency} />
                    <RightSideForm batchCallTasks={batchCallTasks} />
                </div>
                <DialogFooter className="shrink-0 border-t bg-card px-6 py-4">
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button
                        disabled={isSubmitting || !batchCallTasks.length || !availableWorkspaceConcurrency}
                        title="Add recipients before creating a batch call"
                        type="submit"
                        form="batch-call-form">
                        Create a batch call
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function LeftSideForm({ phoneNumbers, batchCallTasks, setTasks, onClose, isSubmitting, setIsSubmitting, availableWorkspaceConcurrency }: {
    phoneNumbers: PhoneNumberWithConfig[]
    batchCallTasks: BatchCallGlobalType["task"][]
    setTasks: (tasks: BatchCallGlobalType["task"][]) => void
    onClose: () => void
    isSubmitting: boolean
    setIsSubmitting: (value: boolean) => void
    availableWorkspaceConcurrency: number
}) {

    const [uploadError, setUploadError] = useState("")
    const [formError, setFormError] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState("")

    const [name, setName] = useState("")
    const [fromPhoneNumberId, setFromPhoneNumberId] = useState("")

    async function CreateBatchCallPipeline(form: HTMLFormElement) {
        if (isSubmitting) return
        setIsSubmitting(true)
        setFormError("")
        let batchSaved = false
        try {
            if (!fromPhoneNumberId) throw new Error("Select an outbound phone number.")
            if (!batchCallTasks.length) throw new Error("Upload at least one recipient.")
            const input = form.elements.namedItem("scheduledDateTime") as HTMLInputElement
            const trigger_timestamp = input.disabled ? Date.now() + 60_000 : new Date(input.value).getTime()

            if (!Number.isFinite(trigger_timestamp) || trigger_timestamp <= Date.now()) {
                input.setCustomValidity("Choose a future date and time")
                input.reportValidity()
                return
            }

            const getFormUserInput = (name: string) => form.elements.namedItem(name) as HTMLInputElement
            const batchDataSavedInDB = await batchCall_DB_create({
                name,
                fromPhoneNumberId,
                tasks: batchCallTasks,
                trigger_timestamp,
                reserved_concurrency: getFormUserInput("reservedConcurrency").valueAsNumber,
                call_time_window: {
                    windows: [{
                        start: getFormUserInput("callWindowStart").valueAsNumber / 60_000,
                        end: getFormUserInput("callWindowEnd").valueAsNumber / 60_000,
                    }],
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    day: JSON.parse(getFormUserInput("callWindowDays").value),
                },
            })
            batchSaved = true

            const response = await fetch("/api/batch-call/inngest/trigger-function", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchCallId: batchDataSavedInDB.batch_call_id,
                    workspaceId: batchDataSavedInDB.workspaceId,
                }),
            })
            if (!response.ok) throw new Error("Could not schedule the batch call.")
            toast.success("Batch call created and scheduled successfully.")
            onClose()
        } catch (error) {
            console.error("Failed to create batch:", error)
            const message = batchSaved ? "Batch saved, but scheduling could not be confirmed. Check this batch before creating another." : error instanceof Error ? error.message : "Failed to create batch. Please try again."
            setFormError(message)
            toast.error(message)
            if (batchSaved) onClose()
        } finally {
            setIsSubmitting(false)
        }
    }

    async function onUpload(file: File) {
        setUploadError("")
        try {
            const batchCallTasks = await batchCallParseFile(file)
            setTasks(batchCallTasks)
            setFileName(file.name)
        } catch (error) {
            setTasks([])
            setFileName("")
            const message = error instanceof Error ? error.message : "Failed to parse CSV"
            setUploadError(message)
            toast.error(message)
        }
    }

    return (
        <form
            id="batch-call-form"
            onSubmit={(event) => { event.preventDefault(); void CreateBatchCallPipeline(event.currentTarget) }}
            className="space-y-6 border-b bg-card p-6 lg:border-r lg:border-b-0">
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-1">
                <h2 className="text-sm font-semibold">Call details</h2>
                <p className="text-xs text-muted-foreground">Choose a name and an outbound number.</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="batch-call-name">Batch call name</Label>
                <Input name="name" value={name} onChange={(event) => setName(event.target.value)} id="batch-call-name" placeholder="e.g. Webinar reminders" className="h-9" />
            </div>

            <BatchCallFromNumber phoneNumbers={phoneNumbers} value={fromPhoneNumberId} onChange={setFromPhoneNumberId} />

            <section aria-labelledby="upload-recipients-heading" className="space-y-3 border-t pt-6">
                <div className="flex items-center justify-between gap-2">
                    <h2 id="upload-recipients-heading" className="text-sm font-semibold">Upload recipients</h2>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground/90"
                        onClick={() => {
                            const link = document.createElement("a")
                            link.href = "/batch-call/batch-call-csv-template.csv"
                            link.download = "batch-call-csv-template.csv"
                            link.click()
                        }}
                    >
                        <Download aria-hidden="true" />
                        Template
                    </Button>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void onUpload(file)
                        event.target.value = ""
                    }}
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload recipients CSV"
                    className="h-40 w-full flex-col gap-3 border-dashed bg-transparent whitespace-normal disabled:opacity-100 dark:bg-transparent"
                >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <UploadCloud aria-hidden="true" className="size-5" />
                    </span>
                    <span className="space-y-1 text-center">
                        <span className="block break-all">{fileName || "Choose a CSV file"}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{fileName ? "Click to choose another file" : "CSV with a to_number column"}</span>
                    </span>
                </Button>
                {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
            </section>

            <HandleScheduleInput />
            <CallTimeWindowInput />
            <ReservedConcurrencyInput availableWorkspaceConcurrency={availableWorkspaceConcurrency} />
        </form>
    )
}

function RightSideForm({ batchCallTasks }: { batchCallTasks: BatchCallGlobalType["task"][] }) {

    const variableNames = [...new Set(batchCallTasks.flatMap((task) => Object.keys(task.llm_dynamic_variables ?? {})))]

    return (
        <section aria-labelledby="recipients-heading" className="flex min-h-80 flex-col bg-muted/20 p-6 lg:p-8">
            <div className="flex min-h-72 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div>
                        <h2 id="recipients-heading" className="text-sm font-semibold">Recipients</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Example recipients with one column per dynamic variable.</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{batchCallTasks.length} recipients</span>
                </div>

                {!batchCallTasks.length ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Users aria-hidden="true" className="size-5" />
                        </span>
                        <div className="max-w-xs space-y-1.5">
                            <p className="text-sm font-medium">No recipients yet</p>
                            <p className="text-sm text-muted-foreground">Upload a CSV file to preview your recipients here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-auto p-5">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>to_number</TableHead>
                                    {variableNames.map((name) => (
                                        <TableHead key={name}>{name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batchCallTasks.map((r, i) => (
                                    <TableRow key={i} className="hover:bg-muted/20">
                                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                        <TableCell className="text-muted-foreground">{r.to_number}</TableCell>
                                        {variableNames.map((name) => (
                                            <TableCell key={name}>{r.llm_dynamic_variables?.[name] ?? "—"}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </section>
    )
}

// MISC

type Props = {
    phoneNumbers: PhoneNumberWithConfig[]
    value: string
    onChange: (value: string) => void
}

export function BatchCallFromNumber({ phoneNumbers, value, onChange }: Props) {

    const phoneNumberItems = phoneNumbers.map((number) => ({
        value: number.id,
        label: number.config?.nickname?.trim() ? `${number.config.nickname.trim()} (${number.phoneNumber})` : number.phoneNumber,
        icon: Phone,
    }))

    return (
        <div className="space-y-2">
            <Label htmlFor="batch-call-number">From number</Label>

            <WebsiteCustomDropdown
                id="batch-call-number"
                value={value}
                onValueChange={onChange}
                options={phoneNumberItems}
                label="Phone numbers"
                placeholder={phoneNumbers.length ? "Select an outbound number" : "No phone numbers available"}
                disabled={!phoneNumbers.length}
            />

            {!phoneNumbers.length && (
                <p className="text-xs text-muted-foreground">
                    Add a phone number in Phone Numbers to create a batch call.
                </p>
            )}
        </div>
    )
}


function HandleScheduleInput() {
    const [deliveryMode, setDeliveryMode] = useState("now")

    return (
        <section aria-labelledby="send-calls-heading" className="space-y-3 border-t pt-6">
            <h2 id="send-calls-heading" className="text-sm font-semibold">Delivery</h2>
            <Tabs value={deliveryMode} onValueChange={(value) => setDeliveryMode(String(value))}>
                <TabsList className="grid h-8 w-full grid-cols-2" aria-label="Delivery">
                    <TabsTrigger value="now">Send now</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>
                <TabsContent value="now">
                    <p className="text-xs text-muted-foreground">Set the start time to one minute after submission.</p>
                </TabsContent>
                <TabsContent value="schedule" className="space-y-2" keepMounted>
                    <Label htmlFor="batch-call-scheduled-time">Date and time</Label>
                    <Input
                        name="scheduledDateTime"
                        id="batch-call-scheduled-time"
                        type="datetime-local"
                        className="h-9"
                        disabled={deliveryMode === "now"}
                        required={deliveryMode === "schedule"}
                        onChange={(event) => event.target.setCustomValidity("")}
                        aria-describedby="batch-call-timezone"
                    />
                    <p id="batch-call-timezone" className="text-xs text-muted-foreground">Uses your device’s local timezone.</p>
                </TabsContent>
            </Tabs>
        </section>
    )
}


function ReservedConcurrencyInput({ availableWorkspaceConcurrency }: { availableWorkspaceConcurrency: number }) {
    const [reservedConcurrency, setReservedConcurrency] = useState(1)

    return (
        <section className="space-y-3 border-t pt-6">
            <div className="space-y-1">
                <Label>Concurrent calls for this batch</Label>
                <p className="text-xs text-muted-foreground">
                    Maximum number of calls this batch can make at the same time.
                </p>
            </div>

            <div className="flex h-9 items-center rounded-md border">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={reservedConcurrency <= 1 || !availableWorkspaceConcurrency}
                    onClick={() => setReservedConcurrency((prev) => Math.max(1, prev - 1))}
                >
                    −
                </Button>

                <Input
                    name="reservedConcurrency"
                    type="number"
                    required
                    min={1}
                    max={availableWorkspaceConcurrency}
                    disabled={!availableWorkspaceConcurrency}
                    value={Math.min(reservedConcurrency, availableWorkspaceConcurrency)}
                    onChange={(e) => setReservedConcurrency(Math.min(availableWorkspaceConcurrency, Math.max(1, Number(e.target.value))))}
                    className="h-full flex-1 border-0 text-center shadow-none focus-visible:ring-0"
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={reservedConcurrency >= availableWorkspaceConcurrency}
                    onClick={() => setReservedConcurrency((prev) => Math.min(availableWorkspaceConcurrency, prev + 1))}
                >
                    +
                </Button>
            </div>

            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {availableWorkspaceConcurrency} of {BATCH_CALL_TOTAL_CONCURRENCY} slots available across unfinished batches.
            </p>
        </section>
    )
}

function CallTimeWindowInput() {
    const [days, setDays] = useState({ Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: true, Sunday: true })
    const [start, setStart] = useState("00:00")
    const [end, setEnd] = useState("23:59")

    return (
        <section className="space-y-3 border-t pt-6">
            <div>
                <Label>When Calls Can Run</Label>
                <p className="text-xs text-muted-foreground">
                    Allowed calling days and hours.
                </p>
            </div>

            <input type="hidden" name="callWindowDays" value={JSON.stringify(Object.keys(days).filter(day => days[day as keyof typeof days]))} />
            <div className="flex gap-1">
                {(Object.keys(days) as (keyof typeof days)[]).map(day => (
                    <Button
                        key={day}
                        type="button"
                        size="sm"
                        variant={days[day] ? "secondary" : "ghost"}
                        className="h-8 flex-1 px-0 text-xs"
                        onClick={() => setDays(prev => ({ ...prev, [day]: !prev[day] }))}
                    >
                        {day.slice(0, 3)}
                    </Button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <Input
                    name="callWindowStart"
                    type="time"
                    required
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="h-9"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                    name="callWindowEnd"
                    type="time"
                    required
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="h-9"
                />
            </div>
        </section>
    )
}
