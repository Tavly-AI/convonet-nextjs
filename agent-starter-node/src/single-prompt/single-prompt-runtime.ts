import { Agent, dedent, type voice } from '@livekit/agents';
import { createAllAgentToolsAvailable, getTimezonLanguageInstructions } from '../sharable-code/agent-helpers.ts';
import type { RuntimeAgentConfig } from '../ingestion/get-agent-config.ts';

export function createSinglePromptAgentFromData(agentConfig: RuntimeAgentConfig): Agent {
    return Agent.create({
        instructions: dedent` 
            ${agentConfig.llmConfig.generalPrompt.trim() || DEFAULT_GENERAL_PROMPT}
            ${getTimezonLanguageInstructions(agentConfig)}
        `,

        onEnter(ctx) { resolveSinglePromptBeginMessage(ctx, agentConfig) },

        tools: createAllAgentToolsAvailable(agentConfig),
    });
}

// MICS STATIC CODE

const DEFAULT_GENERAL_PROMPT = dedent`
  You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.
`;

function resolveSinglePromptBeginMessage(ctx: voice.AgentContext, agentConfig: RuntimeAgentConfig,) {
    const {
        start_speaker = "agent",
        begin_message = "Hey I am a virtual assistant calling from Retell Hospital.",
    } = agentConfig.llmConfig

    if (start_speaker === "user") return

    const text = begin_message.trim()
    if (text) ctx.session.say(text)
}

