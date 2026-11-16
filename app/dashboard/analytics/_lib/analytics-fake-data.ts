import type { AnalyticsGlobalTypes } from "./analytics-globla-types"

const analyticsFakeData: AnalyticsGlobalTypes["Data"][] = [
    {
        title: "Call Counts",
        type: "column",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "Call counts", label: "Oct 28", value: 2 },
            { time: "2026-10-29", metric: "Call counts", label: "Oct 29", value: 1 },
            { time: "2026-10-31", metric: "Call counts", label: "Oct 31", value: 2 },
            { time: "2026-11-04", metric: "Call counts", label: "Nov 04", value: 3 },
            { time: "2026-11-06", metric: "Call counts", label: "Nov 06", value: 2 },
            { time: "2026-11-12", metric: "Call counts", label: "Nov 12", value: 3 },
            { time: "2026-11-13", metric: "Call counts", label: "Nov 13", value: 1 },
        ],
    },
    {
        title: "Call Successful / Unsuccessful",
        type: "donut",
        format: "number",
        data: [
            { time: "2026-11-10", metric: "Successful", label: "Successful", value: 1 },
            { time: "2026-11-10", metric: "Unsuccessful", label: "Unsuccessful", value: 3 },

            { time: "2026-11-11", metric: "Successful", label: "Successful", value: 1 },
            { time: "2026-11-11", metric: "Unsuccessful", label: "Unsuccessful", value: 4 },

            { time: "2026-11-12", metric: "Successful", label: "Successful", value: 1 },
            { time: "2026-11-12", metric: "Unsuccessful", label: "Unsuccessful", value: 4 },
        ],
    },
    {
        title: "Average Call Duration (seconds)",
        type: "number",
        format: "seconds",
        data: [
            { time: "2026-10-28", metric: "Call duration", label: "Oct 28", value: 18 },
            { time: "2026-10-29", metric: "Call duration", label: "Oct 29", value: 25 },
            { time: "2026-10-31", metric: "Call duration", label: "Oct 31", value: 12 },
            { time: "2026-11-04", metric: "Call duration", label: "Nov 04", value: 33 },
            { time: "2026-11-06", metric: "Call duration", label: "Nov 06", value: 20 },
            { time: "2026-11-12", metric: "Call duration", label: "Nov 12", value: 24 },
            { time: "2026-11-13", metric: "Call duration", label: "Nov 13", value: 22 },
        ],
    },
    {
        title: "User Sentiment",
        type: "bar",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "Positive", label: "Positive", value: 1 },
            { time: "2026-10-28", metric: "Neutral", label: "Neutral", value: 1 },

            { time: "2026-10-29", metric: "Positive", label: "Positive", value: 1 },

            { time: "2026-10-31", metric: "Neutral", label: "Neutral", value: 1 },
            { time: "2026-10-31", metric: "Negative", label: "Negative", value: 1 },

            { time: "2026-11-04", metric: "Positive", label: "Positive", value: 2 },
            { time: "2026-11-04", metric: "Neutral", label: "Neutral", value: 1 },

            { time: "2026-11-06", metric: "Positive", label: "Positive", value: 1 },
            { time: "2026-11-06", metric: "Neutral", label: "Neutral", value: 1 },

            { time: "2026-11-12", metric: "Positive", label: "Positive", value: 2 },
            { time: "2026-11-12", metric: "Negative", label: "Negative", value: 1 },

            { time: "2026-11-13", metric: "Neutral", label: "Neutral", value: 1 },
        ],
    },
    {
        title: "Average Call Latency (ms)",
        type: "line",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "Call latency", label: "Oct 28", value: 1250 },
            { time: "2026-10-29", metric: "Call latency", label: "Oct 29", value: 1680 },
            { time: "2026-10-31", metric: "Call latency", label: "Oct 31", value: 1420 },
            { time: "2026-11-04", metric: "Call latency", label: "Nov 04", value: 1550 },
            { time: "2026-11-06", metric: "Call latency", label: "Nov 06", value: 1390 },
            { time: "2026-11-12", metric: "Call latency", label: "Nov 12", value: 1620 },
            { time: "2026-11-13", metric: "Call latency", label: "Nov 13", value: 1408 },
        ],
    },
    {
        title: "Disconnection Reason",
        type: "donut",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "user_hangup", label: "User ended call", value: 1 },
            { time: "2026-10-28", metric: "agent_hangup", label: "Agent ended call", value: 1 },

            { time: "2026-10-29", metric: "user_hangup", label: "User ended call", value: 1 },

            { time: "2026-10-31", metric: "user_hangup", label: "User ended call", value: 1 },
            { time: "2026-10-31", metric: "agent_hangup", label: "Agent ended call", value: 1 },

            { time: "2026-11-04", metric: "user_hangup", label: "User ended call", value: 2 },
            { time: "2026-11-04", metric: "agent_hangup", label: "Agent ended call", value: 1 },

            { time: "2026-11-06", metric: "user_hangup", label: "User ended call", value: 1 },
            { time: "2026-11-06", metric: "error_unknown", label: "Unknown error", value: 1 },

            { time: "2026-11-12", metric: "user_hangup", label: "User ended call", value: 2 },
            { time: "2026-11-12", metric: "agent_hangup", label: "Agent ended call", value: 1 },

            { time: "2026-11-13", metric: "error_unknown", label: "Unknown error", value: 1 },
        ],
    },
    {
        title: "Call Picked Up Rate",
        type: "number",
        format: "percentage",
        data: [
            { time: "2026-10-28", metric: "Picked up", label: "Oct 28", value: 1 },
            { time: "2026-10-29", metric: "Picked up", label: "Oct 29", value: 1 },
            { time: "2026-10-31", metric: "Picked up", label: "Oct 31", value: 2 },
            { time: "2026-11-04", metric: "Picked up", label: "Nov 04", value: 2 },
            { time: "2026-11-06", metric: "Picked up", label: "Nov 06", value: 2 },
            { time: "2026-11-12", metric: "Picked up", label: "Nov 12", value: 2 },
            { time: "2026-11-13", metric: "Picked up", label: "Nov 13", value: 1 },
        ],
    },
    {
        title: "Call Status",
        type: "donut",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "ended", label: "Ended", value: 2 },
            { time: "2026-10-29", metric: "ended", label: "Ended", value: 1 },
            { time: "2026-10-31", metric: "ended", label: "Ended", value: 1 },
            { time: "2026-10-31", metric: "error", label: "Error", value: 1 },
            { time: "2026-11-04", metric: "ended", label: "Ended", value: 2 },
            { time: "2026-11-04", metric: "not_connected", label: "Not Connected", value: 1 },
            { time: "2026-11-06", metric: "ended", label: "Ended", value: 2 },
            { time: "2026-11-12", metric: "ended", label: "Ended", value: 2 },
            { time: "2026-11-12", metric: "error", label: "Error", value: 1 },
            { time: "2026-11-13", metric: "ended", label: "Ended", value: 1 },
        ],
    },
    {
        title: "User Sentiment",
        type: "donut",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "Positive", label: "Positive", value: 1 },
            { time: "2026-10-28", metric: "Neutral", label: "Neutral", value: 1 },
            { time: "2026-10-29", metric: "Positive", label: "Positive", value: 1 },
            { time: "2026-10-31", metric: "Neutral", label: "Neutral", value: 1 },
            { time: "2026-10-31", metric: "Negative", label: "Negative", value: 1 },
            { time: "2026-11-04", metric: "Positive", label: "Positive", value: 2 },
            { time: "2026-11-04", metric: "Neutral", label: "Neutral", value: 1 },
            { time: "2026-11-06", metric: "Positive", label: "Positive", value: 1 },
            { time: "2026-11-06", metric: "Neutral", label: "Neutral", value: 1 },
            { time: "2026-11-12", metric: "Positive", label: "Positive", value: 2 },
            { time: "2026-11-12", metric: "Negative", label: "Negative", value: 1 },
            { time: "2026-11-13", metric: "Neutral", label: "Neutral", value: 1 },
        ],
    },
    {
        title: "Call Direction",
        type: "donut",
        format: "number",
        data: [
            { time: "2026-10-28", metric: "inbound", label: "Inbound", value: 1 },
            { time: "2026-10-28", metric: "outbound", label: "Outbound", value: 1 },
            { time: "2026-10-29", metric: "inbound", label: "Inbound", value: 1 },
            { time: "2026-10-31", metric: "outbound", label: "Outbound", value: 1 },
            { time: "2026-10-31", metric: "webrtc", label: "WebRTC", value: 1 },
            { time: "2026-11-04", metric: "inbound", label: "Inbound", value: 2 },
            { time: "2026-11-04", metric: "outbound", label: "Outbound", value: 1 },
            { time: "2026-11-06", metric: "inbound", label: "Inbound", value: 1 },
            { time: "2026-11-06", metric: "webrtc", label: "WebRTC", value: 1 },
            { time: "2026-11-12", metric: "inbound", label: "Inbound", value: 1 },
            { time: "2026-11-12", metric: "outbound", label: "Outbound", value: 1 },
            { time: "2026-11-12", metric: "webrtc", label: "WebRTC", value: 1 },
            { time: "2026-11-13", metric: "inbound", label: "Inbound", value: 1 },
        ],
    },
] satisfies AnalyticsGlobalTypes["Data"][]