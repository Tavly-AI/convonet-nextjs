import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { AgentSessionMain } from "./_components/main/agent-session-main";
import Loading from "../loading";

export default async function Page() {

    const userId = await getCurrentUserId();
    if (userId === null) redirect("/auth/login");

    return (
        <Suspense fallback={<Loading />}>
            <AgentSessionMain />
        </Suspense>
    )
}
