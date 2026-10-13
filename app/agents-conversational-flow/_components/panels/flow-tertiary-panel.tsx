"use client"

import { useSearchParams } from "next/navigation"

import AgentSessionTertiaryTab from "@/app/agents/_components/main/agent-session-tertiary"

export function FlowTertiaryPanel() {
    const searchParams = useSearchParams()
    const isOpen = searchParams.get("showFlowTertiaryPanel") === "true"

    return (
        <aside className={`absolute bottom-3 right-3 top-20 z-10 flex min-h-0 w-[min(26rem,calc(100%-2rem))] flex-col transition-all duration-300 ease-in-out [&>[data-slot=card]]:h-full [&>[data-slot=card]]:max-h-none ${isOpen ? "translate-x-0 opacity-100" : "pointer-events-none invisible translate-x-full opacity-0"}`}>
            <AgentSessionTertiaryTab />
        </aside>
    )
}