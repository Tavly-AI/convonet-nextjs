"use client"

import { useEffect, useState, useTransition } from "react"
import { UploadCloudIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { loadAgentSession, publishAgent } from "@/app/agents/actions"
import {
    getAgentSession,
    initializeAgentSession,
    writeAgentSession,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentSessionTabSecondary } from "./agent-session-secondary-tab"

export function AgentSessionMain() {
    const searchParams = useSearchParams()
    const agentId = searchParams.get("agentId")

    const [, startSessionLoad] = useTransition()
    const [isPublishing, startPublishing] = useTransition()

    useEffect(() => {
        let cancelled = false

        startSessionLoad(async () => {
            try {
                const agent = agentId ? await loadAgentSession(agentId) : null

                if (cancelled) return
                initializeAgentSession(agent)
            } catch (error) {
                if (cancelled) return
                initializeAgentSession()
                toast.error(error instanceof Error ? error.message : "Failed to load agent.")
            }
        })

        return () => {
            cancelled = true
        }
    }, [agentId])

    function handlePublish() {
        const session = getAgentSession()
        if (!session?.id) {
            toast.error("Agent ID is missing. Create an agent from the dashboard first.")
            return
        }

        startPublishing(async () => {
            try {
                const publishedAgent = await publishAgent(session)
                writeAgentSession(publishedAgent)
                toast.success("Agent published successfully.")
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to publish agent.")
            }
        })
    }


    return (
        <Tabs
            defaultValue="create"
            className="min-h-[calc(100svh-var(--header-height))] flex-1 gap-0 bg-black/10"
        >
            <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b bg-background px-2 py-2">
                <span aria-hidden="true" />
                <TabsList>
                    <TabsTrigger value="create" className="px-4">
                        Create
                    </TabsTrigger>
                    <TabsTrigger value="simulation" className="px-4">
                        Simulation
                    </TabsTrigger>
                </TabsList>
                <Button
                    type="button"
                    className="justify-self-end"
                    disabled={isPublishing}
                    onClick={handlePublish}
                >
                    <UploadCloudIcon data-icon="inline-start" />
                    {isPublishing ? "Publishing..." : "Publish"}
                </Button>
            </div>

            <TabsContent
                value="create"
                className="grid min-h-0 flex-1 gap-2 p-2 xl:grid-cols-[2fr_1fr_1fr]"
            >
                <Card className="min-h-96" />
                <AgentSessionTabSecondary />
                <Card className="min-h-96 gap-0 py-0">
                    <Tabs defaultValue="audio" className="h-full gap-0">
                        <CardHeader className="border-b py-3">
                            <TabsList>
                                <TabsTrigger value="audio">Test Audio</TabsTrigger>
                                <TabsTrigger value="llm">Test LLM</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <TabsContent value="audio" />
                        <TabsContent value="llm" />
                    </Tabs>
                </Card>
            </TabsContent>

            <TabsContent value="simulation" className="min-h-0 flex-1 p-2">
                <Card className="h-full min-h-96" />
            </TabsContent>
        </Tabs>
    )
}
