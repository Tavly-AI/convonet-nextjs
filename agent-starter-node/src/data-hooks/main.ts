import type { JobContext } from '@livekit/agents';
import { voice } from '@livekit/agents';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

type SessionDataHooksOptions = {
    ctx: JobContext;
    session: voice.AgentSession;
    agentId: string;
};

export function registerSessionDataHooks({ ctx, session, agentId }: SessionDataHooksOptions) {

    const sessionLogPath = fileURLToPath(new URL(`../logs/${ctx.job.id}.jsonl`, import.meta.url));

    async function writeSessionLog(entry: Record<string, unknown>) {
        await mkdir(dirname(sessionLogPath), { recursive: true });
        await appendFile(sessionLogPath, `${JSON.stringify({ timestamp: new Date().toISOString(), agentId, roomName: ctx.room.name, ...entry, })}\n`);
    }

    function writeSessionLogSafely(entry: Record<string, unknown>) {
        void writeSessionLog(entry).catch((error) => { console.error('Failed to write LiveKit session log', error); });
    }

    // https://docs.livekit.io/deploy/observability/data/#session-usage
    session.on(voice.AgentSessionEventTypes.SessionUsageUpdated, (event) => {
        writeSessionLogSafely({
            event: 'livekit_session_usage_updated',
            usage: event.usage,
        });
    });

    // https://docs.livekit.io/deploy/observability/data/#conversation-history
    session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (event) => {
        if (event.item.type !== 'message' || event.item.role !== 'assistant') return;

        const { e2eLatency, llmNodeTtft, ttsNodeTtfb, playbackLatency } = event.item.metrics;
        if (e2eLatency === undefined) return;

        writeSessionLogSafely({ event: 'livekit_turn_metrics', metrics: { e2eLatency, llmNodeTtft, ttsNodeTtfb, playbackLatency } });
    });

    // https://docs.livekit.io/deploy/observability/data/#session-reports
    ctx.addShutdownCallback(async () => {
        try {
            const report = ctx.makeSessionReport(session);

            await writeSessionLog({ event: 'livekit_session_report', report: voice.sessionReportToJSON(report), });
        } catch (error) {

            try {
                await writeSessionLog({ event: 'livekit_session_report_failed', error: error instanceof Error ? error.message : String(error), });
            } catch (logError) {
                console.error('Failed to write LiveKit session report', logError);
            }
        }
    });
}
