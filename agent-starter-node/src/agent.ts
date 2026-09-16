import { Agent, dedent } from '@livekit/agents';
import { createBookAppointmentTool } from './agent-config/general-tools/book-appointment.ts';
import { createCallTransferTool } from './agent-config/general-tools/call-transfer.ts';
import { createCheckAvailabilityTool } from './agent-config/general-tools/check-availability.ts';
import { createCodeExecutionTools } from './agent-config/general-tools/code-execution.ts';
import { createCustomFunctionTools } from './agent-config/general-tools/custom-tool.ts';
import { endCallTool } from './agent-config/general-tools/end-call.ts';
import { createPressDigitTool } from './agent-config/general-tools/press-digit.ts';
import type { RuntimeAgentConfig } from './ingestion/get-agent-config.ts';

// Build a custom voice AI assistant with the functional `Agent.create` API
export function createAgent(agentConfig: RuntimeAgentConfig) {
  return Agent.create({
    instructions: dedent`
        You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.
      `,

    tools: [
      endCallTool,
      createCheckAvailabilityTool(agentConfig),
      createBookAppointmentTool(agentConfig),
      ...createCodeExecutionTools(agentConfig),
      ...createCustomFunctionTools(agentConfig),
      ...(() => {
        const tool = createCallTransferTool(agentConfig, createAgent);
        return tool ? [tool] : [];
      })(),
      ...(() => {
        const tool = createPressDigitTool(agentConfig);
        return tool ? [tool] : [];
      })(),
    ],

    // To use a realtime model instead of a voice pipeline, replace the LLM
    // with a RealtimeModel and remove the STT/TTS from the AgentSession
    // (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/)
    // 1. Install '@livekit/agents-plugin-openai'
    // 2. Set OPENAI_API_KEY in .env.local
    // 3. Add `import * as openai from '@livekit/agents-plugin-openai'` to the top of this file
    // 4. Replace the llm option with:
    //    llm: new openai.realtime.RealtimeModel({ voice: 'marin' }),

    // To add tools, specify `tools` in the constructor.
    // Here's an example that adds a simple weather tool.
    // You also have to add `import { tool } from '@livekit/agents'` and `import { z } from 'zod'` to the top of this file
    // tools: [
    //   tool({
    //     name: 'getWeather',
    //     description: dedent`
    //       Use this tool to look up current weather information in the given location.
    //
    //       If the location is not supported by the weather service, the tool will indicate this.
    //       You must tell the user the location's weather is unavailable.
    //     `,
    //     parameters: z.object({
    //       location: z
    //         .string()
    //         .describe('The location to look up weather information for (e.g. city name)'),
    //     }),
    //     execute: async ({ location }) => {
    //       console.log(`Looking up weather for ${location}`);
    //
    //       return 'sunny with a temperature of 70 degrees.';
    //     },
    //   }),
    // ],
  });
}
