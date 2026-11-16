import { Suspense } from "react"
import { AnalyticsDashboard } from "./_components/analytics-dashboard"
import { analytics_GetAllSortsOfData_FromDb } from "./_lib/analytics-get-data-from-db"
import { AnalyticsDashboardLoading } from "./_components/analytics-dashboard-loading"

async function AnalyticsContent({ startTime, endTime }: { startTime: Date, endTime: Date }) {
    const allSortsOfAnalyticsData = await analytics_GetAllSortsOfData_FromDb(startTime, endTime)

    return <AnalyticsDashboard allSortsOfAnalyticsData={allSortsOfAnalyticsData} />
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams

    const start = typeof params.start === "string" ? new Date(params.start) : null
    const end = typeof params.end === "string" ? new Date(params.end) : null

    const customRange = !!(start && end && Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start <= end)
    const endTime = customRange ? end! : new Date()
    const startTime = customRange ? start! : new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000)

    return (
        <Suspense key={`${params.start}-${params.end}`} fallback={<AnalyticsDashboardLoading />}>
            <AnalyticsContent startTime={startTime} endTime={endTime} />
        </Suspense>
    )
}