import type { JobContext, SessionReport } from '@livekit/agents';
import { voice } from '@livekit/agents';
import type { CallRecordDatabaseData } from '../../../app/api/livekit/sessionReport/types.ts';

type SessionDataHooksOptions = {
    ctx: JobContext;
    session: voice.AgentSession;
    agentId: string;
};

export function registerSessionDataHooks({ ctx, session, agentId }: SessionDataHooksOptions) {

    // https://docs.livekit.io/deploy/observability/data/#session-reports
    ctx.addShutdownCallback(async () => {
        try {
            const report: SessionReport = ctx.makeSessionReport(session);
            const reportJson = voice.sessionReportToJSON(report);

            await sendSessionReport(reportJson, agentId, ctx);
        } catch (error) {
            console.error('Failed to send LiveKit session report to Next.js', error);
        }
    });
}



// send to nextjs 
async function sendSessionReport(report: Record<string, unknown>, agentId: string, ctx: JobContext) {
    const baseUrl = process.env.NEXTJS_APP_URL;

    if (!baseUrl) { console.warn('Observability report was not sent because NEXTJS_APP_URL is missing.'); return; }

    const callType = deriveCallType(ctx);
    const { fromNumber, toNumber } = derivePhoneNumbers(ctx, callType);

    console.info("Sending session report to Next.js", { jobId: ctx.job.id, room: ctx.room.name, });
    const response = await fetch(`${baseUrl}/api/livekit/sessionReport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ agentId, report, callType, fromNumber, toNumber }),
    });
    console.info("Session report response from Next.js", { jobId: ctx.job.id, status: response.status, });

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
