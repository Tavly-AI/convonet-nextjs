import type { AnalyticsGlobalTypes } from "./analytics-globla-types"

type DataPoint = AnalyticsGlobalTypes["DataPoint"]
type GraphType = AnalyticsGlobalTypes["Data"]["type"]

export function analytics_displayChart_transformData(data: DataPoint[], type: GraphType, title: AnalyticsGlobalTypes["Data"]["title"]): DataPoint[] {
    switch (type) {
        case "donut":
            return groupByMetric(data)
        case "bar":
            return groupByMetric(data)
        case "number":
            return transformNumberData(data, title)
        case "column":
        case "line":
            return groupByDate(data)
        default:
            return data
    }
}

function transformNumberData(data: DataPoint[], title: string): DataPoint[] {
    const valid = data.filter(point => Number.isFinite(point.value))
    if (!valid.length) return []

    const total = valid.reduce((sum, point) => sum + point.value, 0)
    const isAverage = /\b(avg|average)\b/i.test(title)

    return [{
        ...valid[0],
        value: isAverage ? total / valid.length : total,
    }]
}

function groupByMetric(data: DataPoint[]): DataPoint[] {
    const grouped = new Map<string, DataPoint>()

    for (const point of data) {
        if (!Number.isFinite(point.value) || point.value < 0) continue

        const existing = grouped.get(point.metric)

        if (existing) {
            existing.value += point.value
        } else {
            grouped.set(point.metric, { ...point })
        }
    }

    return [...grouped.values()]
}

function groupByDate(data: DataPoint[]): DataPoint[] {
    const grouped = new Map<string, DataPoint>()

    for (const point of data) {
        if (!Number.isFinite(point.value)) continue

        const existing = grouped.get(point.time)

        if (existing) {
            existing.value += point.value
        } else {
            grouped.set(point.time, {
                ...point,
                label: new Date(`${point.time}T00:00:00`).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                }),
            })
        }
    }

    return [...grouped.values()].sort((a, b) => a.time.localeCompare(b.time))
}