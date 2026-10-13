import type { MainflowSubflowConfig } from '../../../app/agents-conversational-flow/_types/global-cf-types.ts';

export async function getConversationalFlowConfig(agentId: string): Promise<MainflowSubflowConfig> {
    const baseUrl = process.env.NEXTJS_APP_URL ?? 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/agent/get-conversational-flow-config?agentId=${encodeURIComponent(agentId)}`,);

    if (!response.ok) { const body = await response.text(); throw new Error(`Failed to fetch conversational flow config (${response.status}): ${body}`); }

    return (await response.json()) as MainflowSubflowConfig;
}
