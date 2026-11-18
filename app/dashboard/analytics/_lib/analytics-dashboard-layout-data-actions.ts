"use server"
import { randomUUID } from "node:crypto"
import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { AnalyticsGlobalTypes } from "./analytics-globla-types"

const DEFAULT_ANALYTICS_DASHBOARD: AnalyticsGlobalTypes["DashboardLayout"] = {
    name: "Call Dashboard",
    charts: [
        { id: randomUUID(), metric: "combined_cost", type: "number" },
        { id: randomUUID(), metric: "call_count", type: "column" },
        { id: randomUUID(), metric: "call_success", type: "donut" },
        { id: randomUUID(), metric: "average_call_duration", type: "number" },
        { id: randomUUID(), metric: "user_sentiment", type: "bar" },
        { id: randomUUID(), metric: "average_call_p99_latency", type: "line" },
        { id: randomUUID(), metric: "disconnection_reason", type: "donut" },
        { id: randomUUID(), metric: "call_picked_up_rate", type: "number" },
        { id: randomUUID(), metric: "call_status", type: "donut" },
        { id: randomUUID(), metric: "call_direction", type: "donut" },
    ],
}

export async function analytics_getAnalyticsDashboardLayout_data(): Promise<AnalyticsGlobalTypes["DashboardLayout"]> {
    const userId = await getCurrentUserId()
    const user = userId ? await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    }) : null

    if (!user?.workspaceId) return DEFAULT_ANALYTICS_DASHBOARD

    const dashboard = await prisma.analyticsDashboard.upsert({
        where: {
            workspaceId_name: {
                workspaceId: user.workspaceId,
                name: DEFAULT_ANALYTICS_DASHBOARD.name,
            },
        },
        create: {
            workspaceId: user.workspaceId,
            ...DEFAULT_ANALYTICS_DASHBOARD,
        },
        update: {},
        select: { name: true, charts: true },
    })

    return { name: dashboard.name, charts: dashboard.charts as AnalyticsGlobalTypes["DashboardLayout"]["charts"], }
}


export async function analytics_addAnalyticsDashboardChart_data(metric: AnalyticsGlobalTypes["DashboardLayout"]["charts"][number]["metric"], type: AnalyticsGlobalTypes["GraphType"],): Promise<void> {

    const graphTypes: AnalyticsGlobalTypes["GraphType"][] = ["column", "bar", "donut", "line", "number"]
    if (!DEFAULT_ANALYTICS_DASHBOARD.charts.some(chart => chart.metric === metric) || !graphTypes.includes(type)) { throw new Error("Invalid chart") }

    const userId = await getCurrentUserId()
    const user = userId ? await prisma.user.findUnique({
        where: { id: userId },
        select: { workspaceId: true },
    }) : null
    if (!user?.workspaceId) throw new Error("Workspace not found")

    const where = { workspaceId_name: { workspaceId: user.workspaceId, name: DEFAULT_ANALYTICS_DASHBOARD.name } }
    await prisma.$transaction(async tx => {
        const layout = await tx.analyticsDashboard.upsert({
            where,
            create: { workspaceId: user.workspaceId!, ...DEFAULT_ANALYTICS_DASHBOARD },
            update: {},
            select: { charts: true },
        })
        const charts = layout.charts as AnalyticsGlobalTypes["DashboardLayout"]["charts"]
        await tx.analyticsDashboard.update({
            where,
            data: { charts: [...charts, { id: randomUUID(), metric, type }] },
        })
    }, { isolationLevel: "Serializable" })
}
