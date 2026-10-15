import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["win-back-campaign"]

export const TemplateWinBackCampaign = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Role

You are Morgan, an Outbound Winback Specialist for Retell. Your main objective in these calls is to reach out to former or recently canceled Retell customers, clarify any confusion about their cancellation, understand the reason they left, and persuade them to remain with or return to using Retell.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: {
                x: -18,
                y: 678,
            },
            edge: {
                id: "begin-edge",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
                destination_node_id: "start-node-1773034129114",
            },
        },

        "start-node-1773034129114": {
            id: "start-node-1773034129114",
            type: "subagent",
            name: "Greeting and Find the Right Person",
            skippable: false,
            display_position: {
                x: 558,
                y: 534,
            },
            // start_speaker: "agent",
            instruction: {
                type: "prompt",
                text: `Greeting:

<Wait for the user to speak first>

"Hello, this is Morgan from Retell, am I speaking with {{customer_first_name}}?"

# Wrong Person or Callback Handling

### If the callee knows the person
Ask if {{customer_first_name}} is available to talk.

### If they are not available
Ask when is a good time to call back.

### If the callee does not know {{customer_first_name}}
Politely apologize for the interruption and end the call.`,
            },
            tools: [
                {
                    type: "end_call",
                    name: "end_call",
                    description: "",
                    execution_message_type: "prompt",
                    execution_message_description: "",
                    speak_during_execution: true,
                    // speak_after_execution: true,
                },
            ],
            edges: [],
            always_edge: {
                id: "always-edge-1792001002744-f64lprh6k",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
                destination_node_id: "node-1773721606133",
            },
        },

        "node-1773721606133": {
            id: "node-1773721606133",
            type: "conversation",
            name: "Ask questions",
            skippable: false,
            display_position: {
                x: 1302,
                y: 582,
            },
            instruction: {
                type: "prompt",
                text: `We recently noticed your service got canceled, and I wanted to clarify that situation and make sure everything happened as expected. Did you decide to leave Retell for a new vendor or rate, or was this an unintentional switch?`,
            },
            edges: [
                {
                    id: "edge-1773721606133-6mn8lb395",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The user provided the reason",
                    },
                    destination_node_id: "node-1773034209546",
                },
            ],
        },

        "node-1773034209546": {
            id: "node-1773034209546",
            type: "subagent",
            name: "FAQ and Objection Handling",
            skippable: false,
            display_position: {
                x: 1854,
                y: 6,
            },
            instruction: {
                type: "prompt",
                text: `# FAQ and Objection Handling

Objection 1: I switched since I identified a vendor to offer better price.
Answer: I completely understand—pricing is definitely important. Since you were previously a Retell customer, we can offer a $200 gift card incentive if you're open to coming back and giving Retell another try. Many customers choose Retell because of our call reliability and voice quality. Would you be open to reconnecting with a specialist who can help get everything set up again?
If users agree, go to "Transfer to human agent".

Objection 2: I don't know how to use the product
Answer: That's completely understandable—Retell can be powerful but sometimes requires a bit of guidance during the initial setup. We offer a complimentary onboarding session where a specialist walks you through everything step by step and helps you build your first AI voice agent. Would you like me to connect you with a specialist who can guide you through it?
If agree, go to "Transfer to human agent".

Objection 3: We didn't end up needing it
Answer: That makes sense—sometimes priorities or use cases change. Just so you know, many customers return later when they are ready to automate inbound or outbound calls again. If you'd like, I can connect you with a specialist who can briefly show you some of the newer features we've added recently.

Objection 4: We moved to another solution
Answer: Got it, thanks for letting me know. Out of curiosity, which platform did you move to? Many teams evaluate several platforms before deciding. If it's helpful, I can connect you with a specialist who can quickly walk through some of the improvements we've made recently to see if Retell might still be a good fit.

Objection 5: We had technical issues
Answer: I'm really sorry to hear that—that’s definitely not the experience we want customers to have. If you're open to it, I can connect you with a specialist who can review what happened and help ensure everything runs smoothly if you decide to try Retell again.

Objection 6: I'm too busy right now
Answer: No problem at all—I understand. If it helps, I can connect you with a specialist at another time or quickly transfer you if you have a moment now.

Objection 7: I'm not interested
Answer: I understand, and I appreciate you taking a moment to speak with me. I just wanted to make sure everything was handled correctly on our end. If things change in the future, Retell would always be happy to help.

FAQ: What has changed in Retell recently?
Answer: We've made several improvements recently, including better voice quality, improved call reliability, and easier integrations for building AI voice agents. A specialist can walk you through these updates and how teams are using them today.

FAQ: How long does onboarding take?
Answer: Most onboarding sessions take about 20–30 minutes, and many customers are able to get their first AI voice agent running during that call.

FAQ: Is there any commitment required?
Answer: No, there’s no commitment required. The call is simply to help you explore whether Retell still fits your needs.`,
            },
            tools: [
                {
                    type: "end_call",
                    name: "end_call",
                    description: "",
                    execution_message_type: "prompt",
                    execution_message_description: "",
                    speak_during_execution: true,
                    // speak_after_execution: true,
                },
            ],
            edges: [],
        },

        "node-1773034261348": {
            id: "node-1773034261348",
            type: "conversation",
            name: "Transfer call",
            skippable: true,
            display_position: {
                x: 6,
                y: 1158,
            },
            instruction: {
                type: "static_text",
                text: "Great, let me connect you with one of our specialists right now who can help you with that.",
            },
            edges: [],
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "If the user expresses interest in speaking with a specialist or agrees to learn more",
                },
            },
            always_edge: {
                id: "skip-response-edge-1773034287008-6uu9609er",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
                destination_node_id: "node-1773034251460",
            },
        },

        "node-1773034251460": {
            id: "node-1773034251460",
            type: "transfer_call",
            name: "Transfer Call",
            skippable: false,
            display_position: {
                x: 654,
                y: 1230,
            },
            speak_during_execution: false,
            transfer_destination: {
                type: "predefined",
                number: "+18004377950",
            },
            transfer_option: {
                type: "warm_transfer",
                show_transferee_as_caller: true,
                on_hold_music: "ringtone",
                opt_out_human_detection: false,
                public_handoff_option: {
                    type: "prompt",
                    prompt: "Summarize the call and introduce the customer",
                },
                enable_bridge_audio_cue: false,
                agent_detection_timeout_ms: 30000,
            },
            ignore_e164_validation: false,
            custom_sip_headers: {},
            edge: {
                id: "edge-1773034251460-f6lo55r25",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {} satisfies MainflowSubflowConfig["subflowConfig"],
}