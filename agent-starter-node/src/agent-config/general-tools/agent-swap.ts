import { type Agent, handoff, tool } from '@livekit/agents';
import type { AgentSwapTool } from '../../../../app/agents/_lib/functions/general-tools.ts';
import { getAgentConfig, type RuntimeAgentConfig } from '../../ingestion/get-agent-config.ts';

type CreateTargetAgent = (targetConfig: RuntimeAgentConfig) => Agent;

function getAgentSwapTools(agentConfig: RuntimeAgentConfig): AgentSwapTool[] {
  const names = new Set<string>();

  return agentConfig.config.generalTools.flatMap((configuredTool) => {
    if (configuredTool.type !== 'agent_swap') return [];

    const name = configuredTool.name.trim();
    const agentId = configuredTool.agent_id.trim();
    if (!name || !agentId || names.has(name)) return [];

    names.add(name);
    return [{ ...configuredTool, name, agent_id: agentId }];
  });
}

export function createAgentSwapTools(agentConfig: RuntimeAgentConfig, createTargetAgent: CreateTargetAgent) {

  return getAgentSwapTools(agentConfig).map((config) =>

    tool({
      name: config.name,
      description: config.description.trim() || 'Switch the conversation to the configured agent.',
      execute: async (_, { ctx }) => {

        if (config.speak_during_execution && config.execution_message_description?.trim()) {
          const message = config.execution_message_description.trim();
          const speech = config.execution_message_type === 'static_text' ? ctx.session.say(message, { allowInterruptions: false }) : ctx.session.generateReply({ instructions: message, allowInterruptions: false });
          await speech.waitForPlayout();
        }

        try {
          const targetConfig = await getAgentConfig(config.agent_id);
          return handoff({ agent: createTargetAgent(targetConfig), returns: 'The conversation has been switched to the specialist agent.', });

        } catch (error) {
          console.error(`Agent swap to "${config.agent_id}" failed.`, error);
          return 'The destination agent is unavailable. Continue helping the caller.';
        }

      },
    }),
  );
}
