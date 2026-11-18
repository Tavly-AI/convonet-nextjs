"use client"

import { useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { analytics_addAnalyticsDashboardChart_data } from "../_lib/analytics-dashboard-layout-data-actions"
import { ChartNoAxesColumn, ChartNoAxesCombined, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"
import { AnalyticsDisplayChartGroup } from "./analytics-display-chart-group"
import type { AnalyticsGlobalTypes } from "../_lib/analytics-globla-types"

const GRAPH_TYPES = [
    { value: "column", label: "Column", icon: ChartNoAxesColumn },
    { value: "bar", label: "Bar", icon: ChartNoAxesColumn },
    { value: "line", label: "Line", icon: ChartNoAxesCombined },
    { value: "donut", label: "Donut", icon: ChartNoAxesColumn },
    { value: "number", label: "Number", icon: ChartNoAxesColumn },
] satisfies { value: AnalyticsGlobalTypes["GraphType"]; label: string; icon: typeof ChartNoAxesColumn }[]

const METRICS = [
    { value: "combined_cost", label: "Combined Cost" },
    { value: "call_count", label: "Call Counts" },
    { value: "call_success", label: "Call Success" },
    { value: "average_call_duration", label: "Average Call Duration" },
    { value: "user_sentiment", label: "User Sentiment" },
    { value: "average_call_p99_latency", label: "Average Call P99 Latency" },
    { value: "disconnection_reason", label: "Disconnection Reason" },
    { value: "call_picked_up_rate", label: "Pickup Rate" },
    { value: "call_status", label: "Call Status" },
    { value: "call_direction", label: "Call Direction" },
] satisfies { value: AnalyticsGlobalTypes["DashboardLayout"]["charts"][number]["metric"]; label: string }[]

const SAMPLE_DATA: AnalyticsGlobalTypes["DataPoint"][] = [
    { time: "2026-10-28", metric: "Call Counts", label: "Oct 28", value: 2 },
    { time: "2026-10-29", metric: "Call Counts", label: "Oct 29", value: 1 },
    { time: "2026-10-31", metric: "Call Counts", label: "Oct 31", value: 2 },
    { time: "2026-11-04", metric: "Call Counts", label: "Nov 04", value: 3 },
    { time: "2026-11-06", metric: "Call Counts", label: "Nov 06", value: 2 },
    { time: "2026-11-16", metric: "Call Counts", label: "Nov 16", value: 3 },
]

export function AnalyticsDashboardAddChart() {
    const dropdownId = useId()
    const [graphType, setGraphType] = useState<AnalyticsGlobalTypes["GraphType"]>("column")
    const [metric, setMetric] = useState<AnalyticsGlobalTypes["DashboardLayout"]["charts"][number]["metric"]>("call_count")
    const [open, setOpen] = useState(false)

    const router = useRouter()
    const [pending, startTransition] = useTransition()

    function addChart() {
        startTransition(async () => {
            try {
                await analytics_addAnalyticsDashboardChart_data(metric, graphType)
                setOpen(false)
                router.refresh()
            } catch {
                toast.error("Could not save chart. Please try again.")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button type="button" variant="outline" />}>
                <Plus aria-hidden="true" />
                Add Chart
            </DialogTrigger>
            <DialogContent className="flex h-[80dvh] max-h-[800px] w-[calc(100%-2rem)] max-w-[1100px] flex-col gap-5 overflow-y-auto bg-card p-6">
                <DialogHeader className="shrink-0 pr-8">
                    <DialogTitle className="flex items-center gap-3 text-base">
                        <ChartNoAxesColumn className="size-5 text-muted-foreground" />
                        Create Chart
                    </DialogTitle>
                    <DialogDescription className="sr-only">Configure a chart and preview it with sample data before adding it.</DialogDescription>
                </DialogHeader>

                <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,2fr)]">
                    <div className="space-y-6 py-2 lg:space-y-7">
                        <div className="space-y-2">
                            <label htmlFor={`${dropdownId}-graph-type`} className="text-sm font-medium">Graph Type</label>
                            <WebsiteCustomDropdown
                                id={`${dropdownId}-graph-type`}
                                label="Graph Type"
                                value={graphType}
                                options={GRAPH_TYPES}
                                onValueChange={value => setGraphType(value as AnalyticsGlobalTypes["GraphType"])}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor={`${dropdownId}-metric`} className="text-sm font-medium">Call Source Metric</label>
                            <WebsiteCustomDropdown
                                id={`${dropdownId}-metric`}
                                label="Call Source Metric"
                                value={metric}
                                options={METRICS.map(option => ({ ...option, icon: ChartNoAxesColumn }))}
                                onValueChange={value => setMetric(value as typeof metric)}
                            />
                        </div>
                    </div>

                    <div className="flex min-h-[450px] min-w-0 items-center justify-center rounded-xl bg-muted/20 p-6">
                        <div className="w-full max-w-[650px]">
                            <AnalyticsDisplayChartGroup
                                title={METRICS.find(option => option.value === metric)?.label ?? metric}
                                type={graphType}
                                data={SAMPLE_DATA}
                                className="border-border/50 bg-card shadow-sm"
                            />
                            <p className="mt-3 text-center text-xs text-muted-foreground">
                                Sample data · Preview only
                            </p>
                        </div>
                    </div>
                </div>
                <Button type="button" className="self-end" disabled={pending} onClick={addChart}>
                    {pending ? "Saving…" : "Save Chart"}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
