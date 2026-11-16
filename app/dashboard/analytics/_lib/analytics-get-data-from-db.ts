import "server-only"
import type { CallRecordDatabaseData } from "@/app/api/livekit/sessionReport/types"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { AnalyticsGlobalTypes } from "./analytics-globla-types"

type AnalyticsRecords = Awaited<ReturnType<typeof getAnalyticsRecords>>

type AnalyticsData = AnalyticsGlobalTypes["Data"]
type UserSentiment = NonNullable<CallRecordDatabaseData["call_analysis"]>["user_sentiment"]
type E2eLatency = NonNullable<CallRecordDatabaseData["latency"]>["e2e"]

export async function analytics_GetAllSortsOfData_FromDb(startTime: Date, endTime: Date): Promise<AnalyticsData[]> {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    })
    if (!user?.workspaceId) return []

    const records = await getAnalyticsRecords(user.workspaceId, startTime, endTime)
    const [callCounts, callSuccess, averageCallDuration, userSentiment, averageCallP99Latency, disconnectionReason, callPickedUpRate, callStatus, callDirection] = await Promise.all([
        getCallCounts(records),
        getCallSuccess(records),
        getAverageCallDuration(records),
        getUserSentiment(records),
        getAverageCallP99Latency(records),
        getDisconnectionReason(records),
        getCallPickedUpRate(records),
        getCallStatus(records),
        getCallDirection(records),
    ])
    return [callCounts, callSuccess, averageCallDuration, userSentiment, averageCallP99Latency, disconnectionReason, callPickedUpRate, callStatus, callDirection]
}

// PRIVATE FUNCTIONS

async function getAnalyticsRecords(workspaceId: string, startTime: Date, endTime: Date) {
    return prisma.callRecord.findMany({
        where: { workspaceId, channel: "voice", createdAt: { gte: startTime, lte: endTime } },
        select: {
            start_timestamp: true, createdAt: true, duration_ms: true, call_analysis: true,
            latency: true, disconnection_reason: true, call_status: true, call_type: true,
        },
    })
}

async function getCallCounts(records: AnalyticsRecords): Promise<AnalyticsData> {
    const days = new Map<string, number>()

    for (const record of records) {
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        days.set(time, (days.get(time) ?? 0) + 1)
    }

    return {
        title: "Call Counts", type: "column", format: "number",
        data: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([time, value]) => ({
            time, metric: "Call counts", value,
            label: new Date(time).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" }),
        })),
    }
}

async function getCallSuccess(records: AnalyticsRecords): Promise<AnalyticsData> {
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
        title: "Call Successful / Unsuccessful", type: "donut", format: "number",
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


async function getCallStatus(records: AnalyticsRecords): Promise<AnalyticsData> {
    const days = new Map<string, Map<string, number>>()

    for (const record of records) {
        const time = (record.start_timestamp === null ? record.createdAt : new Date(Number(record.start_timestamp))).toISOString().slice(0, 10)
        const day = days.get(time) ?? new Map<string, number>()
        day.set(record.call_status, (day.get(record.call_status) ?? 0) + 1)
        days.set(time, day)
    }

    return {
        title: "Call Status", type: "donut", format: "number",
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