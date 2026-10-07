"use client"

import { Suspense, useState } from "react"

import { AgentSessionPrimaryTab } from "@/app/agents/_components/main/agent-session-primary-tab"
import { AgentSessionTabSecondary } from "@/app/agents/_components/main/agent-session-secondary-tab"
import { useSessionStorageInitAgentSession } from "@/app/agents/_components/main/agent-session-main"
import Loading from "@/app/loading"
import { GeneralToolsEditor } from "@/app/agents/_components/functions/general-tools-editor"

const tabs = ["Global settings", "Node settings"] as const

export function FlowRightSidePanel() {
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Global settings")

    const { isSessionLoading } = useSessionStorageInitAgentSession()

    if (isSessionLoading) return <Loading />

    return (
        <aside className="absolute bottom-3 right-3 top-3 z-10 flex w-[min(26rem,calc(100%-2rem))] flex-col rounded-2xl border border-border bg-card p-4 text-card-foreground">
            <div className="grid grid-cols-2 rounded-xl bg-muted p-1">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "Global settings" && (
                <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto p-1">
                    <Suspense fallback={null}>
                        <AgentSessionPrimaryTab isConversationalFlow={true} />
                        <AgentSessionTabSecondary />
                    </Suspense>
                </div>
            )}

            {activeTab === "Node settings" && (
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                    <GeneralToolsEditor />
                </div>
            )}
        </aside>
    )
}
