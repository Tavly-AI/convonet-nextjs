import type { CF } from '../../../app/agents-conversational-flow/_types/global-cf-types.ts';

type ConversationalFlowConfigResponse = {
    nodes: Record<string, CF['Node']['data']>;
};

export async function getConversationalFlowConfig(agentId: string): Promise<CF['Node']['data'][]> {
    const baseUrl = process.env.NEXTJS_APP_URL ?? 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/agent/get-conversational-flow-config?agentId=${encodeURIComponent(agentId)}`,);

    if (!response.ok) { const body = await response.text(); throw new Error(`Failed to fetch conversational flow config (${response.status}): ${body}`); }

    const flow = (await response.json()) as ConversationalFlowConfigResponse;
    return Object.values(flow.nodes);
}
