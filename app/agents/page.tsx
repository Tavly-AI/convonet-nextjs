import { Suspense } from "react";
import { AgentSessionMain } from "./_components/main/agent-session-main";
import Loading from "../loading";

export default function Page() {
    return (
        <Suspense fallback={<Loading />}>
            <AgentSessionMain />
        </Suspense>
    )
}
