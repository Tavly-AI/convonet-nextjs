"use client"

import {
    ChevronDown,
    Cuboid,
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
import { AgentSessionName } from "@/app/agents/_components/main/agent-session-name"
import { subflow_session_storage } from "../../_lib/flow-subflow-sessonStorage"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"


export function FlowTopNavbarPanel() {
    return (
        <header className="absolute inset-x-0 top-0 z-20 flex min-h-16 flex-wrap items-center gap-3 border-b border-border bg-card/50 px-5 py-2 text-card-foreground">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <AgentSessionName />
            </div>

            <ChangeMainFlowToSubflow />

            <nav aria-label="Flow actions" className="ml-auto flex shrink-0 items-center gap-2">
                <GlobalSettingsButton />

                <TestButton />

                {/* <Button type="button" className="h-9 rounded-xl bg-foreground px-4 text-background hover:bg-foreground/90">
                    Publish
                </Button> */}
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

function ChangeMainFlowToSubflow() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const subflowId = searchParams.get("subflow")

    const subflows = Object.values(subflow_session_storage.getAll())

    function changeFlow(id: string) {
        const params = new URLSearchParams(searchParams.toString())

        if (id === "main") params.delete("subflow")
        else params.set("subflow", id)

        window.location.assign(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="w-52">
            <WebsiteCustomDropdown
                value={subflowId ?? "main"}
                onValueChange={changeFlow}
                label="Agent Subflows"
                options={[
                    {
                        value: "main",
                        label: "Main Flow",
                        icon: Workflow,
                    },
                    ...subflows.map(subflow => ({
                        value: subflow.conversation_flow_component_id!,
                        label: subflow.name,
                        icon: Cuboid,
                    })),
                ]}
            />
        </div>
    )
}