import { Agent, dedent } from '@livekit/agents';
import { createBookAppointmentTool } from './agent-config/general-tools/book-appointment.ts';
import { createCallTransferTool } from './agent-config/general-tools/call-transfer.ts';
import { createCheckAvailabilityTool } from './agent-config/general-tools/check-availability.ts';
import { createCodeExecutionTools } from './agent-config/general-tools/code-execution.ts';
import { createCustomFunctionTools } from './agent-config/general-tools/custom-tool.ts';
import { createAwarenessTools } from './agent-config/general-tools/current-time.ts';
import { endCallTool } from './agent-config/general-tools/end-call.ts';
import { createPressDigitTool } from './agent-config/general-tools/press-digit.ts';
import type { RuntimeAgentConfig } from './ingestion/get-agent-config.ts';
import { getProviderLanguages } from './ingestion/configure-voice-stack.ts';

export function createAgentDefinition(agentConfig: RuntimeAgentConfig) {
  const languages = getProviderLanguages(agentConfig.config.language);
  const timezone = agentConfig.config.timezone?.trim() || 'UTC';

  return Agent.create({
    instructions: dedent` 
      ${agentConfig.llmConfig.generalPrompt.trim() || DEFAULT_GENERAL_PROMPT}

      ## Timezone & Date Guidelines
      You operate in the ${timezone} timezone. Whenever the caller asks about the current time, today's date, or day of the week, call the \`get_current_datetime\` tool to provide an accurate answer.
      ${getPostCallCollectionInstructions(agentConfig.config.post_call_analysis_data)}
      Always respond in ${languages.gpt}.
    `,

    tools: [
      endCallTool,
      createAwarenessTools(agentConfig),
      createCheckAvailabilityTool(agentConfig),
      createBookAppointmentTool(agentConfig),
      ...createCodeExecutionTools(agentConfig),
      ...createCustomFunctionTools(agentConfig),
      ...(() => {
        const tool = createCallTransferTool(agentConfig, createAgentDefinition);
        return tool ? [tool] : [];
      })(),
      ...(() => {
        const tool = createPressDigitTool(agentConfig);
        return tool ? [tool] : [];
      })(),
    ],
  });
}

// MICS STATIC CODE

const DEFAULT_GENERAL_PROMPT = dedent`
  You are a friendly, reliable voice assistant that answers questions, explains topics, and completes tasks with available tools.
`;

export function getPostCallCollectionInstructions(fields: RuntimeAgentConfig["config"]["post_call_analysis_data"] = []) {
  const fieldsToCollect = fields.filter((field) => field.type !== "system-presets" && field.name && field.description);

  if (!fieldsToCollect.length) return "";

  return `
    ## Information to collect
    Collect these details naturally during the conversation. Do not mention extraction or ask again for information the caller already provided. Ask for required details before ending the call; capture optional details when relevant. Never invent a value.
    ${fieldsToCollect.map((field) => `- ${field.name}${field.required ? " (required)" : ""}: ${field.description}`).join("\n")}
  `;
}