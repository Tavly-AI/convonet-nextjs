"use client"

import type { ReactElement } from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { analytics_displayChart_transformData } from "../_lib/analytics-display-chart-transform-data"
import type { AnalyticsGlobalTypes } from "../_lib/analytics-globla-types"

type ChartType = AnalyticsGlobalTypes["GraphType"]
type DataPoint = AnalyticsGlobalTypes["DataPoint"]
type Props = {
    title: string
    type: ChartType
    data: DataPoint[]
    className?: string
    loading?: boolean
    emptyMessage?: string
    metricLabel?: string
    color?: string
    showLegend?: boolean
    valueFormatter?: (value: number) => string
}
type ChartProps = Omit<Props, "type" | "className" | "loading" | "emptyMessage"> & {
    metricLabel: string
    color: string
    valueFormatter: (value: number) => string
    emptyMessage: string
}

const COLORS = ["#5282e8", "#38bdf8", "#a78bfa", "#34d399", "#fbbf24", "#fb7185"]
const formatNumber = (value: number) => value.toLocaleString("en-US")

export function AnalyticsDisplayChartGroup({
    title, type, data, className, loading, emptyMessage = "No data for this period",
    metricLabel = title, color = COLORS[0], showLegend = true, valueFormatter = formatNumber,
}: Props) {

    const transformedData = analytics_displayChart_transformData(data, type, title)

    const chartProps = { title, data: transformedData, metricLabel, color, showLegend, valueFormatter, emptyMessage }

    const content =
        type === "number" ? <NumberChart {...chartProps} />
            : type === "donut" ? <DonutChart {...chartProps} />
                : type === "line" ? <LineChartView {...chartProps} />
                    : type === "bar" ? <BarChartView {...chartProps} />
                        : <ColumnChart {...chartProps} />

    return <Card className={cn("min-w-0 rounded-2xl", className)} aria-busy={loading || undefined}>
        <CardHeader>
            <CardTitle>
                <h3>{title}</h3>
            </CardTitle>
        </CardHeader>
        <CardContent>{loading ? <ChartStatus message="Loading analytics…" /> : content}</CardContent>
    </Card>
}

function ColumnChart(props: ChartProps) {
    const data = props.data.filter((point) => Number.isFinite(point.value))
    if (!data.length) return <ChartStatus message={props.emptyMessage} />

    const tooltip = <ChartTooltipContent formatter={(value) => <TooltipValue label={props.metricLabel} value={Number(value)} format={props.valueFormatter} />} />

    return <>
        <ChartContainer config={{ value: { label: props.metricLabel, color: props.color } }} className="h-72 w-full aspect-auto" aria-label={props.title}>
            <BarChart data={data} accessibilityLayer margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianAxes format={props.valueFormatter} tooltip={tooltip} />
                <Bar dataKey="value" name={props.metricLabel} fill={props.color} maxBarSize={72} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
        </ChartContainer>
        {props.showLegend && <Legend items={[{ label: props.metricLabel, color: props.color }]} />}
    </>
}

function BarChartView(props: ChartProps) {
    const data = props.data.filter((point) => Number.isFinite(point.value))
    if (!data.length) return <ChartStatus message={props.emptyMessage} />

    const tooltip = <ChartTooltipContent formatter={(value) => <TooltipValue label={props.metricLabel} value={Number(value)} format={props.valueFormatter} />} />

    return <>
        <ChartContainer config={{ value: { label: props.metricLabel, color: props.color } }} className="h-72 w-full aspect-auto" aria-label={props.title}>
            <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianAxes horizontal format={props.valueFormatter} tooltip={tooltip} />
                <Bar dataKey="value" name={props.metricLabel} fill={props.color} maxBarSize={72} radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
        </ChartContainer>
        {props.showLegend && <Legend items={[{ label: props.metricLabel, color: props.color }]} />}
    </>
}

function LineChartView(props: ChartProps) {
    const data = props.data.filter((point) => Number.isFinite(point.value))
    if (!data.length) return <ChartStatus message={props.emptyMessage} />

    const tooltip = <ChartTooltipContent formatter={(value) => <TooltipValue label={props.metricLabel} value={Number(value)} format={props.valueFormatter} />} />

    return <>
        <ChartContainer config={{ value: { label: props.metricLabel, color: props.color } }} className="h-72 w-full aspect-auto" aria-label={props.title}>
            <LineChart data={data} accessibilityLayer margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
                <CartesianAxes format={props.valueFormatter} tooltip={tooltip} />
                <Line dataKey="value" name={props.metricLabel} type="linear" stroke={props.color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
        </ChartContainer>
        {props.showLegend && <Legend items={[{ label: props.metricLabel, color: props.color }]} />}
    </>
}

function DonutChart(props: ChartProps) {
    const data = props.data.filter((point) => Number.isFinite(point.value) && point.value >= 0).map((point, index) => ({ ...point, fill: COLORS[index % COLORS.length] }))
    if (data.reduce((total, point) => total + point.value, 0) === 0) { return <ChartStatus message={props.emptyMessage} /> }

    const tooltip = <ChartTooltipContent hideLabel formatter={(value, name) => <TooltipValue label={String(name)} value={Number(value)} format={props.valueFormatter} />} />

    return <>
        <ChartContainer config={{ value: { label: props.metricLabel } }} className="h-72 w-full aspect-auto" aria-label={props.title}>
            <PieChart accessibilityLayer>
                <ChartTooltip content={tooltip} />
                <Pie data={data} dataKey="value" nameKey="label" innerRadius="45%" outerRadius="85%" stroke="var(--card)" strokeWidth={3} isAnimationActive={false} />
            </PieChart>
        </ChartContainer>
        {props.showLegend && <Legend items={data.map((point) => ({ label: point.label, color: point.fill }))} />}
    </>
}

function NumberChart(props: ChartProps) {
    const value = props.data.find((point) => Number.isFinite(point.value))?.value
    if (value === undefined) return <ChartStatus message={props.emptyMessage} />

    return <div className="flex h-72 items-center justify-center">
        <p className="break-all text-center text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
            {props.valueFormatter(value)}
        </p>
    </div>
}

function CartesianAxes({ horizontal = false, format, tooltip }: {
    horizontal?: boolean
    format: (value: number) => string
    tooltip: ReactElement
}) {
    return <>
        <CartesianGrid vertical={horizontal} horizontal={!horizontal} strokeDasharray="4 4" />
        <XAxis type={horizontal ? "number" : "category"} dataKey={horizontal ? undefined : "label"} tickFormatter={horizontal ? format : undefined} axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
        <YAxis type={horizontal ? "category" : "number"} dataKey={horizontal ? "label" : undefined} tickFormatter={horizontal ? undefined : format} axisLine={false} tickLine={false} tickMargin={8} width={horizontal ? 100 : 64} />
        <ChartTooltip content={tooltip} />
    </>
}

function ChartStatus({ message }: { message: string }) {
    return <div role="status" className="flex h-72 items-center justify-center text-sm text-muted-foreground">{message}</div>
}

function TooltipValue({ label, value, format }: { label: string; value: number; format: (value: number) => string }) {
    return <div className="flex w-full items-center justify-between gap-4">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium tabular-nums">{format(value)}</span>
    </div>
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
    return <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {items.map((item, index) => <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
        </li>)}
    </ul>
}
