"use client"

import {
    ChevronDown,
    History,
    MessageSquareText,
    MoreHorizontal,
    Play,
    Settings,
    Share2,
    Sparkles,
    Tag,
    Workflow,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function FlowTopNavbarPanel() {
    return (
        <header className="absolute inset-x-0 top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-card px-5 py-2 text-card-foreground">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <h1
                    className="truncate text-base font-medium"
                    title="Windows OS IT Support Triage Bot (from template)"
                >
                    Windows OS IT Support Triage Bot (from template)
                </h1>

                <Button type="button" variant="outline" className="h-9 gap-2 rounded-xl bg-transparent text-muted-foreground">
                    <Workflow aria-hidden="true" />
                    Main flow
                    <ChevronDown aria-hidden="true" />
                </Button>

                <Button type="button" variant="outline" className="hidden h-7 rounded-lg bg-transparent text-muted-foreground xl:inline-flex">
                    <Tag aria-hidden="true" />
                    Environment
                </Button>
            </div>

            <nav aria-label="Flow actions" className="ml-auto flex shrink-0 items-center gap-2">
                <Button type="button" variant="ghost" className="hidden h-9 gap-2 text-muted-foreground lg:inline-flex">
                    <MessageSquareText aria-hidden="true" />
                    Feedback
                </Button>

                <Button type="button" variant="outline" size="icon-lg" aria-label="More options" title="More options" className="rounded-xl bg-transparent text-muted-foreground">
                    <MoreHorizontal aria-hidden="true" />
                </Button>

                <Button type="button" variant="outline" size="icon-lg" aria-label="Share flow" title="Share flow" className="rounded-xl bg-transparent text-muted-foreground">
                    <Share2 aria-hidden="true" />
                </Button>

                <GlobalSettingsButton />

                <TestButton />

                <Button type="button" className="h-9 rounded-xl bg-foreground px-4 text-background hover:bg-foreground/90">
                    Publish
                </Button>
            </nav>
        </header>
    )
}


function TestButton() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const isOpen = searchParams.get("showFlowTertiaryPanel") === "true"

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => {
                const params = new URLSearchParams(searchParams.toString())

                if (isOpen) {
                    params.delete("showFlowTertiaryPanel")
                } else {
                    params.set("showFlowTertiaryPanel", "true")
                }

                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }}
            className="h-9 gap-2 rounded-xl bg-transparent text-muted-foreground"
        >
            <Play aria-hidden="true" />
            Test
        </Button>
    )
}


function GlobalSettingsButton() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const isOpen = searchParams.get("showFlowRightSidePanel") === "true"

    return (
        <Button
            type="button"
            variant="outline"
            onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                if (isOpen) {
                    params.delete("showFlowRightSidePanel")
                } else {
                    params.set("showFlowRightSidePanel", "true")
                    params.delete("showFlowTertiaryPanel")
                }

                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
            }}
            className="h-9 gap-2 rounded-xl bg-transparent text-muted-foreground"
        >
            <Settings aria-hidden="true" />
            Global Settings
        </Button>
    )
}