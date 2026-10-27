"use client"

import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentSessionTertiaryClient, { AgentSessionLlmClient } from "./agent-session-tertiary-client";
import { useSearchParams } from "next/navigation";
import { isChatAgentSession } from "./agent-session-start-speaker";
import { useState } from "react";
import { PER_SESSION_TEST_TYPE } from "../../_lib/helper-actions";

export default function AgentSessionTertiaryTab() {

    // ============================================================
    // ================= RESOLVE AGENT CHANNEL ====================
    // ============================================================

    const searchParams = useSearchParams()
    const isChat = isChatAgentSession(searchParams)

    // ============================================================
    // ================= RESOLVE SESSION TEST =====================
    // ============================================================

    const [sessionTestType, setSessionTestType] = useState<"test-llm" | "test-audio">("test-audio")

    return (
        <>
            <Card className="h-full min-h-0 overflow-y-auto gap-0 py-0">
                <Tabs value={sessionTestType} onValueChange={setSessionTestType} className="h-full gap-0">
                    <CardHeader className="border-b py-3">
                        <TabsList>
                            {!isChat && <TabsTrigger value={PER_SESSION_TEST_TYPE.AUDIO}>Test Audio</TabsTrigger>}
                            <TabsTrigger value={PER_SESSION_TEST_TYPE.LLM}>Test LLM</TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    <TabsContent value={PER_SESSION_TEST_TYPE.AUDIO} className="mt-0 min-h-0 flex-1">
                        <AgentSessionTertiaryClient />
                    </TabsContent>
                    <TabsContent value={PER_SESSION_TEST_TYPE.LLM} className="mt-0 min-h-0 flex-1">
                        <AgentSessionLlmClient sessionTestType={sessionTestType} />
                    </TabsContent>
                </Tabs>
            </Card>

        </>
    )
}
