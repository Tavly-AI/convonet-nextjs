import type { JobContext, SessionReport } from '@livekit/agents';
import { voice } from '@livekit/agents';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CallRecordDatabaseData } from '../../../app/api/livekit/sessionReport/types.ts';

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
            const report: SessionReport = ctx.makeSessionReport(session);
            const reportJson = voice.sessionReportToJSON(report);

            await writeSessionLog({ event: 'livekit_session_report', report: reportJson, });
            await sendSessionReport(reportJson, agentId, ctx);
        } catch (error) {

            try {
                await writeSessionLog({ event: 'livekit_session_report_failed', error: error instanceof Error ? error.message : String(error), });
            } catch (logError) {
                console.error('Failed to write LiveKit session report', logError);
            }
        }
    });
}



// send to nextjs 
async function sendSessionReport(report: Record<string, unknown>, agentId: string, ctx: JobContext) {
    const baseUrl = process.env.NEXTJS_APP_URL;

    if (!baseUrl) { console.warn('Observability report was not sent because NEXTJS_APP_URL is missing.'); return; }

    const callType = deriveCallType(ctx);
    const { fromNumber, toNumber } = derivePhoneNumbers(ctx, callType);

    const response = await fetch(`${baseUrl}/api/livekit/sessionReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ agentId, report, callType, fromNumber, toNumber }),
    });

    if (!response.ok) { throw new Error(`Observability ingestion failed (${response.status}): ${await response.text()}`); }
}

// derivations

function deriveCallType(ctx: JobContext): CallRecordDatabaseData["call_type"] {
    const participant = [...ctx.room.remoteParticipants.values()].find((p) => p.attributes["sip.callID"] !== undefined);

    if (!participant) { return "webrtc"; }
    return participant.attributes["sip.ruleID"] ? "inbound" : "outbound";
}

function derivePhoneNumbers(ctx: JobContext, callType: CallRecordDatabaseData["call_type"]): { fromNumber: string | null; toNumber: string | null; } {

    if (callType === "webrtc") { return { fromNumber: null, toNumber: null }; }

    const participant = [...ctx.room.remoteParticipants.values()].find((p) => p.attributes["sip.callID"] !== undefined);
    if (!participant) { return { fromNumber: null, toNumber: null } }

    // https://docs.livekit.io/reference/telephony/sip-participant/#sip-attributes
    const phoneNumber = participant.attributes["sip.phoneNumber"] || null;
    const trunkPhoneNumber = participant.attributes["sip.trunkPhoneNumber"] || null;

    if (callType === "inbound") { return { fromNumber: phoneNumber, toNumber: trunkPhoneNumber, }; }
    return { fromNumber: trunkPhoneNumber, toNumber: phoneNumber };
}
