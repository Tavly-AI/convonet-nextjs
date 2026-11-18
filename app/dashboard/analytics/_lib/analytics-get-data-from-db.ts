import "server-only"
import { analytics_getAnalyticsDashboardLayout_data } from "./analytics-dashboard-layout-data-actions"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AGENT_CHANNELS } from "@/lib/constants"
import type { AnalyticsGlobalTypes } from "./analytics-globla-types"
import type { Prisma } from "@/generated/prisma/client"
import { analytics_filter_modal_filter_params } from "./analytics-dashboard-filter-modal-params"

type AnalyticsRecords = Awaited<ReturnType<typeof getAnalyticsRecords>>

type AnalyticsData = AnalyticsGlobalTypes["Data"]
type UserSentiment = NonNullable<CallRecordDatabaseData["call_analysis"]>["user_sentiment"]
type E2eLatency = NonNullable<CallRecordDatabaseData["latency"]>["e2e"]

export async function analytics_GetAllSortsOfData_FromDb(startTime: Date, endTime: Date, filters: AnalyticsGlobalTypes["AnalyticsFilterType"][] = [], dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"] = "call-dashboard"): Promise<AnalyticsData[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })
    if (!user?.workspaceId) return []

    const [records, layout] = await Promise.all([
        getAnalyticsRecords(user.workspaceId, startTime, endTime, filters, dualDashboardType),
        analytics_getAnalyticsDashboardLayout_data(),
    ])
    const metrics = {
        call_count: (records: AnalyticsRecords) => getCallCounts(records, dualDashboardType),
        call_success: (records: AnalyticsRecords) => getCallSuccess(records, dualDashboardType),
        combined_cost: getCombinedCost,
        average_call_duration: getAverageCallDuration,
        user_sentiment: getUserSentiment,
        average_call_p99_latency: getAverageCallP99Latency,
        disconnection_reason: getDisconnectionReason,
        call_picked_up_rate: getCallPickedUpRate,
        call_status: (records: AnalyticsRecords) => getCallStatus(records, dualDashboardType),
        call_direction: getCallDirection,
    } satisfies Record<AnalyticsGlobalTypes["DashboardLayout"]["charts"][number]["metric"], (records: AnalyticsRecords) => Promise<AnalyticsData>>

    const filtered_charts = filterDashboardCharts(layout.charts, dualDashboardType)

    return Promise.all(filtered_charts.map(async chart => ({
        // Older saved layouts may still contain the removed chat_count metric.
        ...await metrics[(chart.metric as string) === "chat_count" ? "call_count" : chart.metric](records),
        type: chart.type,
    })))
}

// PRIVATE FUNCTIONS

function filterDashboardCharts(charts: AnalyticsGlobalTypes["DashboardLayout"]["charts"], dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"]) {
    const chatMetrics: AnalyticsGlobalTypes["DashboardLayout"]["charts"][number]["metric"][] = ["call_count", "call_success", "user_sentiment", "call_status", "combined_cost"]
    return charts.filter(chart => dualDashboardType !== "chat-dashboard" || chatMetrics.includes((chart.metric as string) === "chat_count" ? "call_count" : chart.metric))
}

// filter model options from param
function filterWhere({ field, operator, value }: AnalyticsGlobalTypes["AnalyticsFilterType"]): Prisma.CallRecordWhereInput {
    const [column, ...path] = field.split(".")
    const operation = operator === "eq" ? "equals" : operator === "neq" ? "not" : operator

    if (column === "duration_ms" && typeof value === "number" && !Number.isInteger(value)) {
        if (operator === "eq") return { OR: [] }
        if (operator === "neq") return { duration_ms: { not: null } }
        value = operator === "gt" ? Math.floor(value) : Math.ceil(value)
    }
    if (operator === "contains" && typeof value === "string") value = value.replace(/[\\%_]/g, "\\$&")
    return { [column]: { ...(path.length ? { path } : {}), [operation]: value } }
}

async function getAnalyticsRecords(workspaceId: string, startTime: Date, endTime: Date, filters: AnalyticsGlobalTypes["AnalyticsFilterType"][], dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"]) {
    return prisma.callRecord.findMany({
        where: {
            workspaceId, channel: dualDashboardType === "chat-dashboard" ? AGENT_CHANNELS.CHAT : AGENT_CHANNELS.VOICE, createdAt: { gte: startTime, lte: endTime },
            AND: filters.filter(analytics_filter_modal_filter_params.isValid).map(filterWhere),
        },
        select: {
            start_timestamp: true, createdAt: true, duration_ms: true, call_analysis: true,
            latency: true, disconnection_reason: true, call_status: true, call_type: true, call_cost: true,
        },
    })
}

async function getCallCounts(records: AnalyticsRecords, dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"]): Promise<AnalyticsData> {
    const title = dualDashboardType === "chat-dashboard" ? "Chat Counts" : "Call Counts"
    const days = new Map<string, number>()

    for (const record of records) {
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        days.set(time, (days.get(time) ?? 0) + 1)
    }

    return {
        title, type: "column", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([time, value]) => ({
            time, metric: title, value,
            label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }),
        })),
    }
}

async function getCallSuccess(records: AnalyticsRecords, dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"]): Promise<AnalyticsData> {
    const days = new Map<string, { successful: number; unsuccessful: number }>()

    for (const record of records) {
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? { successful: 0, unsuccessful: 0 }
        const analysis = record.call_analysis
        const success = analysis && typeof analysis === "object" && !Array.isArray(analysis) ? analysis.call_successful : undefined
        if (success === true) day.successful++
        if (success === false) day.unsuccessful++
        days.set(time, day)
    }

    return {
        title: dualDashboardType === "chat-dashboard" ? "Chat Successful / Unsuccessful" : "Call Successful / Unsuccessful", type: "donut", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([time, day]) => [
            { time, metric: "Successful", label: "Successful", value: day.successful },
            { time, metric: "Unsuccessful", label: "Unsuccessful", value: day.unsuccessful },
        ]),
    }
}


async function getAverageCallDuration(records: AnalyticsRecords): Promise<AnalyticsData> {

    const days = new Map<string, { totalDurationMs: number; count: number }>()

    for (const record of records) {
        if (record.duration_ms === null) continue
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? { totalDurationMs: 0, count: 0 }
        day.totalDurationMs += record.duration_ms
        day.count++
        days.set(time, day)
    }

    const data = [...days].sort(([a], [b]) => a.localeCompare(b)).map(([time, day]) => ({
        time,
        metric: "Call duration",
        label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }),
        value: day.totalDurationMs / day.count / 1000,
    }))

    return { title: "Average Call Duration (seconds)", type: "number", format: "seconds", data }
}



async function getUserSentiment(records: AnalyticsRecords): Promise<AnalyticsData> {
    const sentiments = ["Positive", "Neutral", "Negative"] as const satisfies readonly UserSentiment[]
    const days = new Map<string, Record<UserSentiment, number>>()

    for (const record of records) {
        const analysis = record.call_analysis
        const sentiment = analysis && typeof analysis === "object" && !Array.isArray(analysis) ? analysis.user_sentiment : undefined
        if (sentiment !== "Positive" && sentiment !== "Neutral" && sentiment !== "Negative") continue

        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? { Positive: 0, Neutral: 0, Negative: 0 }
        day[sentiment]++
        days.set(time, day)
    }

    return {
        title: "User Sentiment", type: "bar", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([time, day]) =>
            sentiments.filter((sentiment) => day[sentiment] > 0).map((sentiment) => ({
                time, metric: sentiment, label: sentiment, value: day[sentiment],
            })),
        ),
    }
}



async function getAverageCallP99Latency(records: AnalyticsRecords): Promise<AnalyticsData> {
    const days = new Map<string, { totalP99: number; count: number }>()

    for (const record of records) {
        const latency = record.latency
        if (!latency || typeof latency !== "object" || Array.isArray(latency)) continue
        const e2e = latency.e2e
        if (!e2e || typeof e2e !== "object" || Array.isArray(e2e)) continue
        if (typeof e2e.num !== "number" || !Number.isFinite(e2e.num) || e2e.num <= 0) continue
        if (typeof e2e.p99 !== "number" || !Number.isFinite(e2e.p99) || e2e.p99 < 0) continue
        const p99: E2eLatency["p99"] = e2e.p99

        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? { totalP99: 0, count: 0 }
        day.totalP99 += p99
        day.count++
        days.set(time, day)
    }

    return {
        title: "Average Call P99 Latency (ms)", type: "line", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([time, day]) => ({
            time, metric: "Call P99 latency", value: day.totalP99 / day.count,
            label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }),
        })),
    }
}


async function getDisconnectionReason(records: AnalyticsRecords): Promise<AnalyticsData> {
    const days = new Map<string, Map<string, number>>()

    for (const record of records) {
        const reason = record.disconnection_reason
        if (!reason) continue
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? new Map<string, number>()
        day.set(reason, (day.get(reason) ?? 0) + 1)
        days.set(time, day)
    }

    function formatDisconnectionReason(reason: string): string {
        return reason
            .replace(/_/g, " ")
            .replace(/\b\w/g, letter => letter.toUpperCase())
    }

    return {
        title: "Disconnection Reason", type: "donut", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([time, day]) =>
            [...day].sort(([a], [b]) => a.localeCompare(b)).map(([reason, value]) => ({
                time, metric: reason, value,
                label: formatDisconnectionReason(reason),
            })),
        ),
    }
}

async function getCallPickedUpRate(records: AnalyticsRecords): Promise<AnalyticsData> {
    const attemptedStatuses = ["ended", "ongoing", "not_connected", "error"] satisfies CallRecordDatabaseData["call_status"][]


    const attempted = records.filter(record => attemptedStatuses.some(status => status === record.call_status)).length
    const pickedUp = records.filter(record =>
        record.call_status === "ended" || record.call_status === "ongoing"
    ).length

    return {
        title: "Call Picked Up Rate",
        type: "number",
        format: "percentage",
        data: attempted > 0 ? [{
            time: "",
            metric: "Picked up rate",
            label: "Picked up rate",
            value: (pickedUp / attempted) * 100,
        }] : [],
    }
}


async function getCallStatus(records: AnalyticsRecords, dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"]): Promise<AnalyticsData> {
    const days = new Map<string, Map<string, number>>()

    for (const record of records) {
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? new Map<string, number>()
        day.set(record.call_status, (day.get(record.call_status) ?? 0) + 1)
        days.set(time, day)
    }

    return {
        title: dualDashboardType === "chat-dashboard" ? "Chat Status" : "Call Status", type: "donut", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([time, day]) =>
            [...day].sort(([a], [b]) => a.localeCompare(b)).map(([status, value]) => ({
                time, metric: status, value,
                label: status.replace(/_/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()),
            })),
        ),
    }
}


async function getCallDirection(records: AnalyticsRecords): Promise<AnalyticsData> {
    const directions = ["inbound", "outbound", "webrtc"] as const satisfies readonly NonNullable<CallRecordDatabaseData["call_type"]>[]
    const labels = { inbound: "Inbound", outbound: "Outbound", webrtc: "WebRTC" }
    const days = new Map<string, Record<typeof directions[number], number>>()

    for (const record of records) {
        const direction = record.call_type
        if (direction !== "inbound" && direction !== "outbound" && direction !== "webrtc") continue

        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? { inbound: 0, outbound: 0, webrtc: 0 }
        day[direction]++
        days.set(time, day)
    }

    return {
        title: "Call Direction", type: "donut", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).flatMap(([time, day]) =>
            directions.filter(direction => day[direction] > 0).map(direction => ({
                time, metric: direction, label: labels[direction], value: day[direction],
            })),
        ),
    }
}


async function getCombinedCost(records: AnalyticsRecords): Promise<AnalyticsData> {
    const days = new Map<string, number>()
    for (const record of records) {
        const cost = record.call_cost
        const value = cost && typeof cost === "object" && !Array.isArray(cost) ? cost.combined_cost : undefined
        if (typeof value !== "number" || !Number.isFinite(value)) continue
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        days.set(time, (days.get(time) ?? 0) + value)
    }
    return {
        title: "Combined Cost", type: "number", format: "currency",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([time, value]) => ({
            time, metric: "Combined Cost", value,
            label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }),
        })),
    }
}
