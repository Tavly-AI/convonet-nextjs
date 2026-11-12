import { type JobContext, voice } from '@livekit/agents';
import type { RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

export function registerCallSettingsDetectVoicemail(ctx: JobContext, session: voice.AgentSession, { channel, config }: RuntimeAgentConfig,): void {

    const option = config.voicemail_option;
    if (!shouldDetectCallSettings(channel, config)) return;

    const action = option?.action;
    const handlesVoicemail = action !== undefined && action.type !== 'bridge_transfer';

    const prompt = option?.detection_prompt?.trim();
    let detector: voice.AMD | undefined;
    let closed = false;
    let handlingVoicemail = false;
    let closing: Promise<void> | undefined;

    function cleanup(): Promise<void> {
        closed = true;
        session.off(voice.AgentSessionEventTypes.Close, cleanup);
        return closing ??= (detector?.aclose() ?? Promise.resolve()).catch((error) => {
            console.warn('[Voicemail] Failed to close detection:', error);
        });
    }

    async function detect(): Promise<void> {
        try {
            detector = new voice.AMD(session, { interruptOnMachine: false, waitUntilFinished: true, ...(prompt ? { prompt } : {}), });
            session.once(voice.AgentSessionEventTypes.Close, cleanup);
            ctx.addShutdownCallback(cleanup);

            const prediction = await detector.execute();
            if (closed) return;

            // handle ivr-detection and ios-screening/android-screening
            if (prediction.category === voice.AMDCategory.MACHINE_IVR) {
                if (await resolveCallSettingsAndroidIosScreening(config, prediction.category, session, closed)) return;
                if (await resolveCallSettingsIvrDetection(config, prediction.category, session, closed)) return;
            }
            if (!handlesVoicemail || prediction.category !== voice.AMDCategory.MACHINE_VM) return;

            handlingVoicemail = true;
            session.input.setAudioEnabled(false);
            await session.interrupt({ force: true }).await;
            if (closed) return;

            if (action?.type === 'hangup') return;

            if (action?.type === 'static_text') {
                if (!action.text.trim()) return;
                const speech = session.say(action.text, { allowInterruptions: false });
                await speech.waitForPlayout();
            } else if (action?.type === 'prompt') {
                if (!action.text.trim()) return;
                const speech = session.generateReply({
                    instructions: `You have reached voicemail. Leave only a voicemail message following these instructions:\n${action.text}\nDo not ask questions, call tools, or continue the conversation.`,
                    toolChoice: 'none',
                    allowInterruptions: false,
                });
                await speech.waitForPlayout();
            }
        } catch (error) {
            if (!closed) console.warn('[Voicemail] Failed:', error);
        } finally {
            if (handlingVoicemail && !closed) session.shutdown({ drain: false });
            await cleanup();
        }
    }

    void detect();
}

// MISC CODE

function shouldDetectCallSettings(channel: RuntimeAgentConfig['channel'], config: RuntimeAgentConfig['config']): boolean {
    return channel === 'voice' && Boolean(config.voicemail_option || config.ivr_option || config.call_screening_option);
}

async function resolveCallSettingsIvrDetection(config: RuntimeAgentConfig['config'], category: voice.AMDCategory, session: voice.AgentSession, closed: boolean,): Promise<boolean> {
    if (!config.ivr_option || category !== voice.AMDCategory.MACHINE_IVR) return false;

    session.input.setAudioEnabled(false);
    await session.interrupt({ force: true }).await;

    if (!closed) session.shutdown({ drain: false });

    return true;
}


async function resolveCallSettingsAndroidIosScreening(config: RuntimeAgentConfig['config'], category: voice.AMDCategory, session: voice.AgentSession, closed: boolean,): Promise<boolean> {
    const option = config.call_screening_option;
    if (!option || category !== voice.AMDCategory.MACHINE_IVR) return false;

    const identity = option.agent_identity.trim();
    const purpose = option.call_purpose.trim();
    const response = [identity && `Hi, this is ${identity}.`, purpose && `I'm calling to ${purpose}.`].filter(Boolean).join(' ');
    if (response && !closed) await session.say(response, { allowInterruptions: false }).waitForPlayout();
    return true;
}
