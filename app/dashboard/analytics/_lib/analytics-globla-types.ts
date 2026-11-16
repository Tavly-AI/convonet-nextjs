export type AnalyticsGlobalTypes = {
    GraphType: "column" | "bar" | "donut" | "line" | "number"

    DataPoint: {
        time: string
        metric: string
        label: string
        value: number
    }

    Data: {
        title: string
        format?: "number" | "percentage" | "currency" | "seconds"
        type: "column" | "bar" | "donut" | "line" | "number"
        data: AnalyticsGlobalTypes["DataPoint"][]
    }
}
