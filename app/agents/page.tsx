"use client"

import { AgentSessionMain } from "./_components/main/agent-session-main";

export default function Page() {
    return (
        <>
            {/* <VoiceModalPopup onOpenChange={() => { }} open={true} selectedVoiceId={null} /> */}
            <AgentSessionMain />
        </>
    )
}