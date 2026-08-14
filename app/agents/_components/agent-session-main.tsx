"use client"

import { Card, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgentSessionTabSecondary } from "./agent-session-tab-secondary"

export function AgentSessionMain() {
    return (
        <Tabs
            defaultValue="create"
            className="min-h-[calc(100svh-var(--header-height))] flex-1 gap-0 bg-black/10"
        >
            <div className="flex shrink-0 justify-center border-b bg-background py-2">
                <TabsList>
                    <TabsTrigger value="create" className="px-4">
                        Create
                    </TabsTrigger>
                    <TabsTrigger value="simulation" className="px-4">
                        Simulation
                    </TabsTrigger>
                </TabsList>
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
