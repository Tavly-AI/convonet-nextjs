import type { JobContext } from '@livekit/agents';
import { voice } from '@livekit/agents';
import { PER_SESSION_TEST_TYPE } from '../../../app/agents/_components/main/agent-session-tertiary-server.ts';
import { encodeToolExecutionEvent, TOOL_EVENTS_TOPIC } from '../../../lib/livekit-tool-events.ts';

export function registerToolExecutionEvents(ctx: JobContext, session: voice.AgentSession) {
    const roomName = ctx.job.room?.name;
    // Browser audio sessions use call-* rooms; text tests use test-llm-* rooms.
    if (!roomName?.startsWith('call-') && !roomName?.startsWith(`${PER_SESSION_TEST_TYPE.LLM}-`)) return;

    const onExecuted = (event: voice.FunctionToolsExecutedEvent) => {
        for (const call of event.functionCalls) {
            const output = event.functionCallOutputs.find((item) => item.callId === call.callId);
            if (!output) continue;
            void (async () => {
                const participant = ctx.room.localParticipant;
                if (!participant) return;
                await participant.publishData(encodeToolExecutionEvent({
                    type: 'tool_executed',
                    call_id: call.callId,
                    name: call.name,
                    arguments: call.args,
                    output: output.output,
                    is_error: output.isError,
                    timestamp: event.createdAt,
                }), { reliable: true, topic: TOOL_EVENTS_TOPIC });
            })().catch((error: unknown) => console.error('Failed to publish tool execution event', error));
        }
    };
    session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, onExecuted);
    ctx.addShutdownCallback(async () => {
        session.off(voice.AgentSessionEventTypes.FunctionToolsExecuted, onExecuted);
    });
}
