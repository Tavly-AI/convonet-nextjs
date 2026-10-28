import { Agent, dedent, voice } from '@livekit/agents';
import { createAllAgentToolsAvailable, getTimezonLanguageInstructions } from '../sharable-code/agent-helpers.ts';
import type { RuntimeAgentConfig } from '../ingestion/get-agent-config.ts';
import { resolveSinglePromptBeginMessage } from './helper-functions.ts';

export function createSinglePromptAgentFromData(agentConfig: RuntimeAgentConfig): Agent {
    return Agent.create({
        instructions: dedent` 
            ${agentConfig.llmConfig.generalPrompt.trim() || DEFAULT_GENERAL_PROMPT}
            ${getTimezonLanguageInstructions(agentConfig)}
        `,

        onEnter(ctx) { resolveSinglePromptBeginMessage(ctx, agentConfig); },

        tools: createAllAgentToolsAvailable(agentConfig),
    });
}

// MICS STATIC CODE

const DEFAULT_GENERAL_PROMPT = dedent`
  You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.
`;
