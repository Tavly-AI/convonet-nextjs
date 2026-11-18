export type AnalyticsGlobalTypes = {
    DualDashboardType: "call-dashboard" | "chat-dashboard"

    GraphType: "column" | "bar" | "donut" | "line" | "number"

    DashboardLayout: {
        name: string
        charts: {
            id: string
            metric: | "combined_cost" | "call_count" | "call_success" | "average_call_duration" | "user_sentiment" | "average_call_p99_latency" | "disconnection_reason" | "call_picked_up_rate" | "call_status" | "call_direction"
            type: AnalyticsGlobalTypes["GraphType"]
        }[]
    }

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

    AnalyticsFilterType: {
        field: string
        operator: string;
        value: string | number | boolean
    }

}
