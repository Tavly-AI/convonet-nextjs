import { type JobContext, voice } from '@livekit/agents';
import { RoomEvent } from '@livekit/rtc-node';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

function resolveUserDtmfSettings({ channel, config }: RuntimeAgentConfig) {
    if (channel !== 'voice' || !config.allow_user_dtmf) return null;

    const options = config.user_dtmf_options;
    if (!options) return null;

    const { digit_limit, timeout_ms, termination_key } = options;
    if (!Number.isSafeInteger(digit_limit) || digit_limit <= 0 || !Number.isSafeInteger(timeout_ms) || timeout_ms <= 0 || !/^[0-9*#]$/.test(termination_key)) return null;

    return { digitLimit: digit_limit, timeoutMs: timeout_ms, terminationKey: termination_key, allowInterruption: config.allow_dtmf_interruption ?? false, };
}

export function registerCallSettingsUserDtmf(ctx: JobContext, session: voice.AgentSession, agent: RuntimeAgentConfig): void {
    const settings = resolveUserDtmfSettings(agent);
    if (!settings) return;

    const { digitLimit, timeoutMs, terminationKey, allowInterruption } = settings;
    const events = voice.AgentSessionEventTypes;

    let buffer = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    let replying = false;
    const pending: string[] = [];

    async function drain(): Promise<void> {
        if (closed || replying || !pending.length) return;
        if (!allowInterruption && session.agentState !== 'listening') return;

        replying = true;

        try {
            const reply = session.generateReply({ userInput: `User keypad input: ${pending.shift()!}`, });
            await reply.waitForPlayout();
        } catch {
            if (!closed) console.warn('[DTMF] Failed to respond to keypad input.');
        } finally {
            replying = false;
            if (!closed) void drain();
        }
    }

    function submit(): void {
        clearTimeout(timer);
        timer = undefined;

        if (closed || !buffer) return;

        pending.push(buffer);
        buffer = '';
        void drain();
    }

    function onDtmf(_code: number, digit: string): void {
        if (closed || !/^[0-9*#]$/.test(digit)) return;

        if (allowInterruption) {
            try {
                void session.interrupt({ force: true }).await.catch(() => {
                    if (!closed) console.warn('[DTMF] Failed to interrupt speech.');
                });
            } catch {
                if (!closed) console.warn('[DTMF] Failed to interrupt speech.');
            }
        }

        if (digit === terminationKey) return submit();

        buffer += digit;

        if (buffer.length >= digitLimit) return submit();

        clearTimeout(timer);
        timer = setTimeout(submit, timeoutMs);
    }

    function cleanup(): void {
        if (closed) return;
        closed = true;

        clearTimeout(timer);
        buffer = '';
        pending.length = 0;

        ctx.room.off(RoomEvent.DtmfReceived, onDtmf);
        session.off(events.AgentStateChanged, drain);
        session.off(events.Close, cleanup);
    }

    ctx.room.on(RoomEvent.DtmfReceived, onDtmf);
    session.on(events.AgentStateChanged, drain);
    session.once(events.Close, cleanup);
    ctx.addShutdownCallback(async () => cleanup());
}
