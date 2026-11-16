"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarDays, Ellipsis, ListFilter, MessageSquare, Phone, Plus, Share, Ungroup } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AnalyticsGlobalTypes } from "../_lib/analytics-globla-types"
import { AnalyticsDisplayChartGroup } from "./analytics-display-chart-group"

export function AnalyticsDashboard({ allSortsOfAnalyticsData }: { allSortsOfAnalyticsData: AnalyticsGlobalTypes["Data"][] }) {

    const { state: sidebarState, isMobile } = useSidebar()
    const charts = [...allSortsOfAnalyticsData]

    return (
        <main className={cn(
            "m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6",
            !isMobile && sidebarState === "expanded" && "max-w-[calc(100vw-var(--sidebar-width)-2rem)]",
        )}>
            <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
            <Tabs defaultValue="calls" className="min-w-0 flex-1 gap-5">
                <div className="border-b">
                    <TabsList variant="line" aria-label="Analytics dashboards" className="h-10 max-w-full justify-start gap-4">
                        <TabsTrigger value="calls" className="px-0">
                            <Phone className="size-4" aria-hidden="true" />
                            Call Dashboard
                        </TabsTrigger>
                        <TabsTrigger value="chats" className="px-0" disabled>
                            <MessageSquare className="size-4" aria-hidden="true" />
                            Chat Dashboard
                        </TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <SelectRangePickerModal />
                        {/* <Button type="button" variant="outline">
                            <ListFilter aria-hidden="true" />
                            Filter
                        </Button>
                        <Button type="button" variant="outline">
                            <Ungroup aria-hidden="true" />
                            Breakdown
                        </Button> */}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* <Button type="button" variant="outline">
                            <Share aria-hidden="true" />
                            Share
                        </Button>
                        <Button type="button" variant="outline">
                            <Plus aria-hidden="true" />
                            Add Chart
                        </Button>
                        <Button type="button" variant="outline" size="icon" aria-label="More options">
                            <Ellipsis aria-hidden="true" />
                        </Button> */}
                    </div>
                </div>
                <TabsContent value="calls">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {charts.map((card, index) => {
                            return (
                                <AnalyticsDisplayChartGroup
                                    key={`${card.title}-${card.type}-${index}`} title={card.title} type={card.type} data={card.data}
                                    valueFormatter={VALUE_FORMATTERS[card.format ?? "number"]}
                                />
                            )
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="chats" />
            </Tabs>
        </main>
    )
}

// MISC CODE

const VALUE_FORMATTERS: Record<NonNullable<AnalyticsGlobalTypes["Data"]["format"]>, (value: number) => string> = {
    number: value => value.toLocaleString("en-US"),
    percentage: value => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`,
    currency: value => `₹${value.toLocaleString("en-IN")}`,
    seconds: value => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}s`,
}

function SelectRangePickerModal() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const start = searchParams.get("start")
    const end = searchParams.get("end")
    const customRange = Boolean(start && end)

    const [open, setOpen] = useState(false)
    const [pending, startTransition] = useTransition()
    const [range, setRange] = useState<DateRange | undefined>({
        from: start ? new Date(start) : undefined,
        to: end ? new Date(end) : undefined,
    })

    function applyRange(reset = false) {
        const params = new URLSearchParams(searchParams.toString())

        if (reset) {
            params.delete("start")
            params.delete("end")
        } else {
            if (!range?.from || !range.to) return

            const startTime = new Date(range.from)
            const endTime = new Date(range.to)

            startTime.setHours(0, 0, 0, 0)
            endTime.setHours(23, 59, 59, 999)

            params.set("start", startTime.toISOString())
            params.set("end", endTime.toISOString())
        }

        setOpen(false)
        startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={<Button type="button" variant="outline" disabled={pending} />}>
                <CalendarDays aria-hidden="true" />
                <span suppressHydrationWarning>
                    <span suppressHydrationWarning>
                        {customRange
                            ? `${new Date(start!).toLocaleDateString()} – ${new Date(end!).toLocaleDateString()}`
                            : "Last 7 days"}
                    </span>
                </span>
            </PopoverTrigger>

            <PopoverContent align="center" className="w-auto p-0">
                <Calendar
                    mode="range"
                    defaultMonth={range?.from}
                    selected={range}
                    onSelect={setRange}
                    numberOfMonths={2}
                />

                <div className="flex justify-between gap-2 border-t p-3">
                    <Button variant="outline" onClick={() => applyRange(true)}>
                        Last 7 days
                    </Button>
                    <Button disabled={!range?.from || !range.to || pending} onClick={() => applyRange()}>
                        Apply
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}