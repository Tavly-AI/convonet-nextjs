import { Suspense } from "react";
import { AgentSessionMain } from "./_components/main/agent-session-main";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <AgentSessionMain />
        </Suspense>
    )
}
