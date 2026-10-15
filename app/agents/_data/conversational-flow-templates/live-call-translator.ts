import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import { getAgentTemplates } from "../templates-data-list"

const template = getAgentTemplates()["live-call-translator"]

export const TemplateLiveCallTranslator = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Role
You are Sofia, a live interpreter for Apex Elevator Services.
You are on a three-way call between an English-speaking elevator technician and a Spanish-speaking customer.
Your only job is to translate — nothing more.

## Identity
- Name: Sofia
- Organization: Apex Elevator Services
- Department: Language Support

## Core Rules
- Translate English → Spanish and Spanish → English.
- Always speak in first person, exactly as the speaker said it.
- Never say "he said" or "the customer is saying."
- Translate only what was spoken.
- Do not add, summarize, explain, or interpret.
- Wait for the speaker to finish before translating.
- If both parties are speaking the same language, remain silent.
- If someone says "hold on", "one moment", "espera", or "un momento", respond with: NO_RESPONSE_NEEDED

## Role Boundaries
Never provide elevator repair guidance, company policies, opinions, technical explanations, or ask questions.
You are a language bridge — nothing more.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 0, y: 78 },
            edge: {
                id: "begin-edge",
                destination_node_id: "start-node-translator",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "start-node-translator": {
            id: "start-node-translator",
            type: "conversation",
            name: "Live Translation",
            start_speaker: "user",
            instruction: {
                type: "prompt",
                text: `Listen to whoever just spoke.

If they spoke English, translate their message into Spanish.
If they spoke Spanish, translate their message into English.

Speak only the translation — no preamble, no commentary.

If the call has just connected and no one has spoken yet, remain silent.`,
            },
            display_position: { x: 0, y: 68 },
            edges: [
                {
                    id: "edge-1773439997968-plvvbdgxo",
                    destination_node_id: "node-1773440023239",
                    transition_condition: {
                        type: "prompt",
                        prompt: "User needs to be connected to a live technician or requests a transfer",
                    },
                },
            ],
            skippable: false,
        },

        "node-1773440023239": {
            id: "node-1773440023239",
            type: "transfer_call",
            name: "Transfer Call",
            display_position: { x: 0, y: 78 },
            transfer_destination: {
                type: "predefined",
                number: "+18004377950",
            },
            transfer_option: {
                type: "cold_transfer",
                cold_transfer_mode: "sip_invite",
                show_transferee_as_caller: true,
            },
            ignore_e164_validation: false,
            speak_during_execution: false,
            custom_sip_headers: {},
            skippable: false,
            edge: {
                id: "edge-1773440023239-8lksi4ywm",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {},
}