"use client"

import { CheckCircle2, ChevronLeft, Download, UploadCloud, Users } from "lucide-react"

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
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BatchCallAbsoluteModal() {
    return (
        <Dialog>
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
                    <div className="space-y-6 border-b bg-card p-6 lg:border-r lg:border-b-0">
                        <div className="space-y-1">
                            <h2 className="text-sm font-semibold">Call details</h2>
                            <p className="text-xs text-muted-foreground">Choose a name and an outbound number.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batch-call-name">Batch call name</Label>
                            <Input id="batch-call-name" placeholder="e.g. Webinar reminders" className="h-9" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="batch-call-number">From number</Label>
                            <Select disabled>
                                <SelectTrigger id="batch-call-number" className="h-9 w-full">
                                    <SelectValue placeholder="Select an outbound number" />
                                </SelectTrigger>
                            </Select>
                        </div>

                        <section aria-labelledby="upload-recipients-heading" className="space-y-3 border-t pt-6">
                            <div className="flex items-center justify-between gap-2">
                                <h2 id="upload-recipients-heading" className="text-sm font-semibold">Upload recipients</h2>
                                <Button variant="ghost" size="sm" disabled>
                                    <Download aria-hidden="true" />
                                    Template
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                disabled
                                aria-label="Upload recipients CSV"
                                className="h-40 w-full flex-col gap-3 border-dashed bg-transparent whitespace-normal disabled:opacity-100 dark:bg-transparent"
                            >
                                <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                    <UploadCloud aria-hidden="true" className="size-5" />
                                </span>
                                <span className="space-y-1 text-center">
                                    <span className="block">Choose a CSV file</span>
                                    <span className="block text-xs font-normal text-muted-foreground">or drag and drop · Up to 50 MB</span>
                                </span>
                            </Button>
                        </section>

                        <section aria-labelledby="send-calls-heading" className="space-y-3 border-t pt-6">
                            <h2 id="send-calls-heading" className="text-sm font-semibold">Delivery</h2>
                            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                                <div className="space-y-1">
                                    <p className="font-medium">Send now</p>
                                    <p className="text-xs text-muted-foreground">Start calling when you create the batch.</p>
                                </div>
                                <CheckCircle2 aria-hidden="true" className="size-4" />
                            </div>
                        </section>
                    </div>

                    <section aria-labelledby="recipients-heading" className="flex min-h-80 flex-col bg-muted/20 p-6 lg:p-8">
                        <div className="flex min-h-72 flex-1 flex-col overflow-hidden rounded-xl border bg-card">
                            <div className="border-b px-5 py-4">
                                <h2 id="recipients-heading" className="text-sm font-semibold">Recipients</h2>
                                <p className="mt-1 text-xs text-muted-foreground">Review your recipient list before starting the batch.</p>
                            </div>
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <Users aria-hidden="true" className="size-5" />
                                </span>
                                <div className="max-w-xs space-y-1.5">
                                    <p className="text-sm font-medium">No recipients yet</p>
                                    <p className="text-sm text-muted-foreground">Upload a CSV file to preview your recipients here.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <DialogFooter className="shrink-0 border-t bg-card px-6 py-4">
                    <DialogClose render={<Button variant="outline" />}>
                        Cancel
                    </DialogClose>
                    <Button disabled>Create a batch call</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
