"use client"

import { VoiceModalPopup } from "./_components/voice-modal-popup";

export default function Page() {
    return (
        <>
            <VoiceModalPopup onOpenChange={() => { }} open={true} selectedVoiceId={null} />
        </>
    )
}