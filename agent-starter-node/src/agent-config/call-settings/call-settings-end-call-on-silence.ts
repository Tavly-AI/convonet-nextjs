import { type JobContext, voice } from '@livekit/agents';
import { RoomEvent } from '@livekit/rtc-node';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

export function registerCallSettingsEndCallOnSilence(ctx: JobContext, session: voice.AgentSession, { channel, config }: RuntimeAgentConfig): void {
    const timeoutMs = config.end_call_after_silence_ms;
    if (channel !== 'voice' || typeof timeoutMs !== 'number' || !Number.isFinite(config.end_call_after_silence_ms) || timeoutMs <= 0) return;

    const events = voice.AgentSessionEventTypes;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    function clearTimer(): void {
        clearTimeout(timer);
        timer = undefined;
    }

    function onStateChanged(): void {
        if (closed) return;
        if (session.agentState !== 'listening' || session.userState === 'speaking') {
            clearTimer();
            return;
        }

        if (timer !== undefined) return;
        timer = setTimeout(() => {
            cleanup();
            session.shutdown();
        }, timeoutMs);
    }

    function onDtmf(): void {
        clearTimer();
        onStateChanged();
    }

    function cleanup(): void {
        closed = true;
        clearTimer();
        session.off(events.UserStateChanged, onStateChanged);
        session.off(events.AgentStateChanged, onStateChanged);
        session.off(events.Close, cleanup);
        ctx.room.off(RoomEvent.DtmfReceived, onDtmf);
    }

    session.on(events.UserStateChanged, onStateChanged);
    session.on(events.AgentStateChanged, onStateChanged);
    session.once(events.Close, cleanup);
    ctx.room.on(RoomEvent.DtmfReceived, onDtmf);
    ctx.addShutdownCallback(async () => cleanup());
    onStateChanged();
}
