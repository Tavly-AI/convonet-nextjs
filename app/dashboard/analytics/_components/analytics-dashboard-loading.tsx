import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsDashboardLoading() {
    return (
        <main className="m-4 flex min-h-0 min-w-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:m-6 lg:p-6">

            {/* Heading */}
            <Skeleton className="h-7 w-24" />

            {/* Tabs */}
            <div className="flex gap-5 border-b pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-32" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-9 w-52 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                </div>

                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-9 rounded-lg" />
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                    <div
                        key={index}
                        className="flex h-[405px] min-w-0 flex-col rounded-2xl border border-border p-4"
                    >
                        {/* Chart title */}
                        <Skeleton className="h-5 w-3/4" />

                        {/* Chart content */}
                        <div className="flex flex-1 items-center justify-center py-6">
                            {index % 3 === 1 ? (
                                <div className="relative flex size-56 items-center justify-center rounded-full bg-muted/50">
                                    <div className="size-28 rounded-full bg-card" />
                                </div>
                            ) : index % 3 === 2 ? (
                                <Skeleton className="h-14 w-32" />
                            ) : (
                                <div className="flex h-full w-full items-end justify-around gap-3 px-6 pb-4">
                                    {[65, 85, 45, 95, 70, 55, 35].map((height, i) => (
                                        <Skeleton
                                            key={i}
                                            className="w-full rounded-t-md"
                                            style={{ height: `${height}%` }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-3 rounded-full" />
                            <Skeleton className="h-3 w-28" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}