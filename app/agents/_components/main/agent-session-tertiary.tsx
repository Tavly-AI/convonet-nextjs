import { Card, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AgentSessionTertiaryTab() {
    return (
        <>
            <Card className="max-h-[91vh] min-h-0 overflow-y-auto gap-0 py-0">
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

        </>
    )
}