"use client"

import { Suspense } from "react"

import AgentSessionTertiaryTab from "@/app/agents/_components/main/agent-session-tertiary"

export function FlowTertiaryPanel() {
    return (
        <aside className="absolute bottom-3 right-3 top-3 z-10 flex w-[min(26rem,calc(100%-2rem))] flex-col [&>[data-slot=card]]:h-full [&>[data-slot=card]]:max-h-none">
            <Suspense fallback={null}>
                <AgentSessionTertiaryTab />
            </Suspense>
        </aside>
    )
}