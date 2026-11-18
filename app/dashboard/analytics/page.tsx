import { Suspense } from "react"
import { AnalyticsDashboard } from "./_components/analytics-dashboard"
import { analytics_GetAllSortsOfData_FromDb } from "./_lib/analytics-get-data-from-db"
import { AnalyticsDashboardLoading } from "./_components/analytics-dashboard-loading"
import { analytics_filter_modal_filter_params } from "./_lib/analytics-dashboard-filter-modal-params"
import type { AnalyticsGlobalTypes } from "./_lib/analytics-globla-types"

async function AnalyticsContent({ startTime, endTime, filters, dualDashboardType }: { startTime: Date, endTime: Date, filters: AnalyticsGlobalTypes["AnalyticsFilterType"][], dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"] }) {
    const allSortsOfAnalyticsData = await analytics_GetAllSortsOfData_FromDb(startTime, endTime, filters, dualDashboardType)

    return <AnalyticsDashboard allSortsOfAnalyticsData={allSortsOfAnalyticsData} />
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const params = await searchParams
    const dualDashboardType: AnalyticsGlobalTypes["DualDashboardType"] = params["dual-dashboard-type"] === "chat-dashboard" ? "chat-dashboard" : "call-dashboard"
    const filters = analytics_filter_modal_filter_params.read(typeof params.filters === "string" ? params.filters : null)

    const start = typeof params.start === "string" ? new Date(params.start) : null
    const end = typeof params.end === "string" ? new Date(params.end) : null

    const customRange = !!(start && end && Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && start <= end)
    const endTime = customRange ? end! : new Date()
    const startTime = customRange ? start! : new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000)

    return (
        <Suspense key={`${dualDashboardType}-${params.start}-${params.end}-${JSON.stringify(filters)}`} fallback={<AnalyticsDashboardLoading />}>
            <AnalyticsContent startTime={startTime} endTime={endTime} filters={filters} dualDashboardType={dualDashboardType} />
        </Suspense>
    )
}
