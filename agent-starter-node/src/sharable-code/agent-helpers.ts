import { dedent } from '@livekit/agents';
import { createAgentSwapTools } from '../agent-config/general-tools/agent-swap.ts';
import { createBookAppointmentTool } from '../agent-config/general-tools/book-appointment.ts';
import { createCallTransferTool } from '../agent-config/general-tools/call-transfer.ts';
import { createCheckAvailabilityTool } from '../agent-config/general-tools/check-availability.ts';
import { createCodeExecutionTools } from '../agent-config/general-tools/code-execution.ts';
import { createCustomFunctionTools } from '../agent-config/general-tools/custom-tool.ts';
import { createAwarenessTools } from '../agent-config/general-tools/current-time.ts';
import { endCallTool } from '../agent-config/general-tools/end-call.ts';
import { createPressDigitTool } from '../agent-config/general-tools/press-digit.ts';
import { createRetrieveKnowledgeBaseFunctionTools } from '../agent-config/general-tools/retrieve-knowledge-base.ts';
import type { RuntimeAgentConfig } from '../ingestion/get-agent-config.ts';
import { getProviderLanguages } from '../ingestion/configure-voice-stack.ts';

import { createSinglePromptAgentFromData } from '../single-prompt/single-prompt-runtime.ts';

// SHARABLE CODE

export function getTimezonLanguageInstructions(agentConfig: RuntimeAgentConfig) {
  const languages = getProviderLanguages(agentConfig.config.language);
  const timezone = agentConfig.config.timezone?.trim() || 'UTC';

  return dedent`
    ## Timezone & Date Guidelines
    You operate in the ${timezone} timezone. Whenever the caller asks about the current time, today's date, or day of the week, call the \`get_current_datetime\` tool to provide an accurate answer.
    ${getPostCallCollectionInstructions(agentConfig.config.post_call_analysis_data)}
    Always respond in ${languages.gpt}.
  `;
}

export function getPostCallCollectionInstructions(fields: RuntimeAgentConfig["config"]["post_call_analysis_data"] = []) {
  const fieldsToCollect = fields.filter((field) => field.type !== "system-presets" && field.name && field.description);

  if (!fieldsToCollect.length) return "";

  return `
    ## Information to collect
    Collect these details naturally during the conversation. Do not mention extraction or ask again for information the caller already provided. Ask for required details before ending the call; capture optional details when relevant. Never invent a value.
    ${fieldsToCollect.map((field) => `- ${field.name}${field.required ? " (required)" : ""}: ${field.description}`).join("\n")}
  `;
}

export function createAllAgentToolsAvailable(agentConfig: RuntimeAgentConfig) {
  const callTransfer = createCallTransferTool(agentConfig, createSinglePromptAgentFromData)
  const pressDigit = createPressDigitTool(agentConfig)
  const agentSwaps = createAgentSwapTools(agentConfig, createSinglePromptAgentFromData)

  return [
    endCallTool,
    createAwarenessTools(agentConfig),
    createCheckAvailabilityTool(agentConfig),
    createBookAppointmentTool(agentConfig),
    ...createCodeExecutionTools(agentConfig),
    ...createCustomFunctionTools(agentConfig),
    ...createRetrieveKnowledgeBaseFunctionTools(agentConfig),
    ...agentSwaps,
    ...(callTransfer ? [callTransfer] : []),
    ...(pressDigit ? [pressDigit] : []),
  ]
}


export function getHandbookInstructions(agentConfig: RuntimeAgentConfig): string {
  const guidelines = {
    default_personality: 'Use a warm, helpful, and reliable baseline personality.',
    conversational_personality: 'Keep responses natural, clear, and easy to follow. Prefer concise conversational language over formal monologues.',
    natural_filler_words: 'Use occasional natural conversational fillers where appropriate, without overusing them or reducing clarity.',
    high_empathy: "Acknowledge the user's situation and feelings with care. Respond empathetically without making assumptions about how they feel.",
    echo_verification: 'Repeat important details back to the user to confirm accuracy, especially names, dates, amounts, and identifiers. Avoid unnecessarily repeating sensitive information.',
    nato_phonetic_alphabet: 'Use the NATO phonetic alphabet when clarifying ambiguous letters or spelling identifiers, rather than for ordinary conversation.',
    speech_normalization: 'When speaking, express dates, numbers, symbols, and abbreviations naturally and unambiguously. Preserve exact values in tool arguments and written identifiers.',
    smart_matching: "Adapt to the user's wording and preferred level of detail while keeping the meaning accurate. Ask for clarification when intent is ambiguous.",
    ai_disclosure: 'Be transparent that you are an AI assistant. Briefly disclose this in your first generated response unless already disclosed in the conversation, and answer questions about your identity honestly.',
    scope_boundaries: "Stay within the agent's defined role and available capabilities. Explain limitations clearly and offer an appropriate next step for requests outside that scope.",
  } satisfies Record<keyof RuntimeAgentConfig['config']['handbook_config'], string>;

  const handbook = agentConfig.config.handbook_config;
  const enabledGuidelines = (Object.keys(guidelines) as Array<keyof typeof guidelines>).filter(key => handbook?.[key] ?? true).map(key => `- ${guidelines[key]}`);

  if (!enabledGuidelines.length) return '';

  return `AGENT HANDBOOK:\nApply these conversation guidelines while following the agent's task instructions and required flow transitions.\n${enabledGuidelines.join('\n')}`;
}