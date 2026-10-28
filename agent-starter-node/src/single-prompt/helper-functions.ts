import { voice } from "@livekit/agents";
import type { RuntimeAgentConfig } from "../ingestion/get-agent-config";

// =============================================================================
// ========================= RESOLVE BEGIN MESSAGE =============================
// =============================================================================

export function resolveSinglePromptBeginMessage(ctx: voice.AgentContext, agentConfig: RuntimeAgentConfig) {
    const { start_speaker = 'agent', begin_message, begin_after_user_silence_ms } = agentConfig.llmConfig;

    // Case 1: User first, wait indefinitely
    if (start_speaker === 'user' && begin_after_user_silence_ms == null) return;

    // Case 2: User first, generate after timeout
    if (start_speaker === 'user')
        return scheduleOpening(ctx, begin_after_user_silence_ms!, () => void ctx.session.generateReply());

    // Case 3: Agent first, skip empty message
    if (begin_message === '') return;

    // Case 4: Agent first, speak static or generate
    scheduleOpening(ctx, agentConfig.config.begin_message_delay_ms ?? 1000, () =>
        begin_message?.trim() ? void ctx.session.say(begin_message.trim()) : void ctx.session.generateReply()
    );
}

function scheduleOpening(ctx: voice.AgentContext, delay: number, speak: () => void) {
    const { session } = ctx;
    if (session.userState === 'speaking') return;

    const events = voice.AgentSessionEventTypes;
    const cancel = () => {
        clearTimeout(timer);
        session.off(events.UserStateChanged, onUserSpeaking);
        session.off(events.Close, cancel);
    };

    // Case 5: User speaks before timeout, cancel opening
    const onUserSpeaking = (e: voice.UserStateChangedEvent) => { if (e.newState === 'speaking') cancel(); };

    // Case 6: Session ends, clear timer and listeners
    session.on(events.UserStateChanged, onUserSpeaking);
    session.once(events.Close, cancel);

    const timer = setTimeout(() => { cancel(); speak(); }, Math.max(0, delay));
}

// =============================================================================
// ======================= RESOLVE BEGIN MESSAGE END ===========================
// =============================================================================
