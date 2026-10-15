import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["outreach-dialer"]

export const TemplateOutreachDialer = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...template.config.generalTools,

            ({
                type: "end_call",
                name: "end_call",
                description: "Politely end the call when the prospect declines, voicemail is reached, a callback is requested, or the conversation is complete.",
            } satisfies GeneralTool),

            ({
                type: "transfer_call",
                name: "transfer_call",
                description: "Transfer a qualified prospect or a prospect requesting human assistance to the sales team.",
                transfer_destination: {
                    type: "predefined",
                    number: "+16504371378",
                },
                transfer_option: {
                    type: "cold_transfer",
                    show_transferee_as_caller: false,
                },
                custom_sip_headers: {},
                ignore_e164_validation: false,
                speak_during_execution: false,
            } satisfies GeneralTool),
        ] satisfies GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,

        generalPrompt: `## Role

You are **Jordan**, a **Sales Development Representative for PeakReach**, an AI-powered outreach platform that helps businesses automate first-touch outbound calls at scale.

Your role is to call prospects who have shown interest — visited a pricing page, downloaded a resource, attended a webinar, or submitted a partial form — and qualify them quickly before routing warm leads to a human closer.

Because 80–90% of outbound calls are low-yield, your job is to qualify and route — or exit cleanly.

If the prospect is not a fit or not ready, end the call warmly and leave the door open.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 0, y: 85 },
            edge: {
                id: "begin-edge",
                destination_node_id: "comp-node-od-start-001",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "comp-node-od-start-001": {
            id: "comp-node-od-start-001",
            type: "subflow",
            name: "IVR Navigation And Opening",
            skippable: false,
            display_position: { x: 534, y: 6 },
            conversation_flow_component_id: "cf-comp-od-start-001",
            edges: [
                {
                    id: "comp-edge-od-engaged",
                    destination_node_id: "node-od-name-capture",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Prospect agreed to talk and is engaged",
                    },
                },
                {
                    id: "comp-edge-od-callback",
                    destination_node_id: "node-od-callback",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Prospect asked to be called back at a better time",
                    },
                },
                {
                    id: "comp-edge-od-voicemail",
                    destination_node_id: "end-call-od-main",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Voicemail reached or call could not be connected",
                    },
                },
            ],
            else_edge: {
                id: "comp-else-edge-od",
                destination_node_id: "end-call-od-main",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-od-callback": {
            id: "node-od-callback",
            type: "conversation",
            name: "Callback",
            skippable: false,
            display_position: { x: 1100, y: 600 },
            instruction: {
                type: "prompt",
                text: "Ask when would be a better time to reach them.\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-callback-time-given",
                    destination_node_id: "node-od-callback-ack",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user provides a better time to be called back",
                    },
                },
            ],
        },

        "node-od-callback-ack": {
            id: "node-od-callback-ack",
            type: "conversation",
            name: "Callback Acknowledged",
            skippable: false,
            display_position: { x: 1650, y: 600 },
            instruction: {
                type: "static_text",
                text: "Got it — I'll reach out then. Thanks for your time.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-callback-ack",
                destination_node_id: "end-call-od-main",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-od-main": {
            id: "end-call-od-main",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 2200, y: 600 },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },

        "node-od-name-capture": {
            id: "node-od-name-capture",
            type: "conversation",
            name: "Name Capture",
            skippable: false,
            display_position: { x: 1100, y: 10 },
            instruction: {
                type: "static_text",
                text: "Before I get into it — who am I speaking with?",
            },
            edges: [
                {
                    id: "edge-name-provided",
                    destination_node_id: "node-od-name-confirm",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user provides their name",
                    },
                },
            ],
        },

        "node-od-name-confirm": {
            id: "node-od-name-confirm",
            type: "conversation",
            name: "Name Confirmation",
            skippable: false,
            display_position: { x: 1650, y: 10 },
            instruction: {
                type: "prompt",
                text: "Repeat the name back to the user using the Name Confirmation Guide to verify it is correct.\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-name-confirmed",
                    destination_node_id: "node-od-role-check",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user confirms their name is correct",
                    },
                },
            ],
        },

        "node-od-role-check": {
            id: "node-od-role-check",
            type: "conversation",
            name: "Role Check",
            skippable: false,
            display_position: { x: 2200, y: 10 },
            instruction: {
                type: "prompt",
                text: "Just want to make sure I'm talking to the right person — are you involved in sales, operations, hiring, or whatever decision you were researching at the company?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-role-yes",
                    destination_node_id: "node-od-interest-signal",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user confirms they are involved in the relevant area or decision",
                    },
                },
                {
                    id: "edge-role-no",
                    destination_node_id: "node-od-wrong-person",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user says they are not involved or not the right person",
                    },
                },
            ],
        },

        "node-od-wrong-person": {
            id: "node-od-wrong-person",
            type: "conversation",
            name: "Wrong Person",
            skippable: false,
            display_position: { x: 2750, y: 600 },
            instruction: {
                type: "prompt",
                text: "Ask who at the company would handle this kind of decision.\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-wrong-person-name-given",
                    destination_node_id: "node-od-wrong-person-exit",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user provides the name or role of who handles this, or confirms they do not know",
                    },
                },
            ],
        },

        "node-od-wrong-person-exit": {
            id: "node-od-wrong-person-exit",
            type: "conversation",
            name: "Wrong Person Exit",
            skippable: false,
            display_position: { x: 3300, y: 600 },
            instruction: {
                type: "static_text",
                text: "That's really helpful — thanks. I'll make a note of that.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-wrong-person",
                destination_node_id: "end-call-od-wrong-person",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-od-wrong-person": {
            id: "end-call-od-wrong-person",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 3850, y: 600 },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },

        "node-od-interest-signal": {
            id: "node-od-interest-signal",
            type: "conversation",
            name: "Anchor to Interest Signal",
            skippable: false,
            display_position: { x: 2750, y: 10 },
            instruction: {
                type: "prompt",
                text: "So when you {{interest_signal}}, what were you trying to figure out?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-interest-answered",
                    destination_node_id: "node-od-current-situation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user explains what they were trying to figure out or why they were looking",
                    },
                },
            ],
        },

        "node-od-current-situation": {
            id: "node-od-current-situation",
            type: "conversation",
            name: "Current Situation",
            skippable: false,
            display_position: { x: 3300, y: 10 },
            instruction: {
                type: "prompt",
                text: "And how are you currently handling that today?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-situation-answered",
                    destination_node_id: "node-od-pain-point",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user describes how they are currently handling the problem",
                    },
                },
            ],
        },

        "node-od-pain-point": {
            id: "node-od-pain-point",
            type: "conversation",
            name: "Pain Point",
            skippable: false,
            display_position: { x: 3850, y: 10 },
            instruction: {
                type: "prompt",
                text: "What's the biggest frustration with how it works right now?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-pain-answered",
                    destination_node_id: "node-od-timeline",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user describes their biggest frustration or challenge",
                    },
                },
            ],
        },

        "node-od-timeline": {
            id: "node-od-timeline",
            type: "conversation",
            name: "Timeline",
            skippable: false,
            display_position: { x: 4400, y: 10 },
            instruction: {
                type: "prompt",
                text: "If you found a solution that worked, is this something you'd want to move on in the next month or two — or is it more of a down-the-road thing?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-timeline-answered",
                    destination_node_id: "node-od-decision-maker",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user answers when they would want to move on a solution",
                    },
                },
            ],
        },

        "node-od-decision-maker": {
            id: "node-od-decision-maker",
            type: "conversation",
            name: "Decision Maker",
            skippable: false,
            display_position: { x: 4950, y: 10 },
            instruction: {
                type: "prompt",
                text: "Are you the one who would sign off on something like this, or would others be involved?\n<*Wait for customer response*>",
            },
            edges: [
                {
                    id: "edge-decision-maker-answered",
                    destination_node_id: "node-od-qual-split",
                    transition_condition: {
                        type: "prompt",
                        prompt: "user answers whether they are the decision maker or if others would be involved",
                    },
                },
            ],
        },

        "node-od-qual-split": {
            id: "node-od-qual-split",
            type: "branch",
            name: "Qualification Logic Split",
            skippable: false,
            display_position: { x: 5500, y: 10 },
            edges: [
                {
                    id: "edge-qualified",
                    destination_node_id: "node-od-transfer-call",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Has a clear and active pain point AND is the decision maker or a strong influencer AND timeline is within 90 days AND current situation indicates a real gap",
                    },
                },
            ],
            else_edge: {
                id: "edge-not-qualified",
                destination_node_id: "node-od-not-qualified",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-od-transfer-call": {
            id: "node-od-transfer-call",
            type: "transfer_call",
            name: "Transfer Call",
            skippable: false,
            display_position: { x: 6600, y: 10 },
            speak_during_execution: false,
            transfer_destination: {
                type: "predefined",
                number: "+16504371378",
            },
            transfer_option: {
                type: "cold_transfer",
                show_transferee_as_caller: false,
            },
            custom_sip_headers: {},
            ignore_e164_validation: false,
            edge: {
                id: "edge-transfer-failed",
                destination_node_id: "end-call-od-transfer-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "end-call-od-transfer-failed": {
            id: "end-call-od-transfer-failed",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 7150, y: 10 },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },

        "node-od-not-qualified": {
            id: "node-od-not-qualified",
            type: "conversation",
            name: "Not Qualified Warm Exit",
            skippable: false,
            display_position: { x: 6050, y: 450 },
            instruction: {
                type: "prompt",
                text: "That makes sense — sounds like the timing isn't quite right. I'll make a note and we can follow up when it makes more sense. Thanks for taking a minute.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-not-qualified",
                destination_node_id: "end-call-od-not-qualified",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-od-not-qualified": {
            id: "end-call-od-not-qualified",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 6600, y: 450 },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },

        "node-od-escalation": {
            id: "node-od-escalation",
            type: "conversation",
            name: "Escalation",
            skippable: false,
            display_position: { x: 0, y: 1100 },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "- user is angry or frustrated\n- user is not speaking English\n- user would like to speak to a human\n- user is not interested",
                },
            },
            instruction: {
                type: "static_text",
                text: "Let me get someone on our team who can help you directly.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-escalation",
                destination_node_id: "node-od-escalation-transfer",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-od-escalation-transfer": {
            id: "node-od-escalation-transfer",
            type: "transfer_call",
            name: "Transfer Call",
            skippable: false,
            display_position: { x: 550, y: 1100 },
            speak_during_execution: false,
            transfer_destination: {
                type: "predefined",
                number: "+16504371378",
            },
            transfer_option: {
                type: "cold_transfer",
                show_transferee_as_caller: false,
            },
            custom_sip_headers: {},
            ignore_e164_validation: false,
            edge: {
                id: "edge-escalation-transfer-failed",
                destination_node_id: "end-call-od-escalation",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "end-call-od-escalation": {
            id: "end-call-od-escalation",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 1100, y: 1100 },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {
        "cf-comp-od-start-001": {
            conversation_flow_component_id: "cf-comp-od-start-001",
            name: "IVR Navigation And Opening",
            flex_mode: true,

            nodes: [
                {
                    id: "ivr-od-start",
                    type: "subflow_start",
                    name: "Start",
                    skippable: false,
                    display_position: { x: -300, y: 150 },
                    edge: {
                        id: "ivr-od-start-edge",
                        destination_node_id: "ivr-internal-od-nav",
                        transition_condition: {
                            type: "prompt",
                            prompt: "Start",
                        },
                    },
                },

                {
                    id: "ivr-internal-od-nav",
                    type: "conversation",
                    name: "IVR Navigation",
                    skippable: false,
                    display_position: { x: 200, y: 150 },
                    start_speaker: "user",
                    instruction: {
                        type: "prompt",
                        text: `The call has just connected — wait to hear who picks up.

If a live person answers directly, transition to the Opening node.

If an IVR or auto-attendant answers:
- Navigate toward reaching a live person using DTMF or speech as required.
- If the IVR asks for a name or extension, provide {{prospect_name}} if available.

If voicemail is reached, transition to Exit — Voicemail.

If a gatekeeper or receptionist answers:
Provide a natural variation of:
> "Hi, could I speak with {{prospect_name}}?"

<*Wait for customer response*>

Once connected to the prospect, transition to the Opening node.`,
                    },
                    edges: [
                        {
                            id: "ivr-internal-edge-od-human",
                            destination_node_id: "ivr-internal-od-opening",
                            transition_condition: {
                                type: "prompt",
                                prompt: "A live prospect answers directly or gatekeeper connects the call to the prospect",
                            },
                        },
                        {
                            id: "ivr-internal-edge-od-voicemail",
                            destination_node_id: "ivr-exit-od-voicemail",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Voicemail or answering machine is reached",
                            },
                        },
                        {
                            id: "ivr-internal-edge-od-failure",
                            destination_node_id: "ivr-exit-od-voicemail",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Wrong number, call cannot be connected, or IVR cannot be navigated",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-internal-od-opening",
                    type: "conversation",
                    name: "Opening",
                    skippable: false,
                    display_position: { x: 700, y: 150 },
                    instruction: {
                        type: "static_text",
                        text: "Hey, this is Jordan from PeakReach — quick call, I promise. You {{interest_signal}} recently from this number, so I just wanted to reach out. Do you have sixty seconds?",
                    },
                    edges: [
                        {
                            id: "ivr-internal-edge-od-yes",
                            destination_node_id: "ivr-exit-od-success",
                            transition_condition: {
                                type: "prompt",
                                prompt: "user agrees or says yes or indicates they have time to talk",
                            },
                        },
                        {
                            id: "ivr-internal-edge-od-callback",
                            destination_node_id: "ivr-exit-od-callback",
                            transition_condition: {
                                type: "prompt",
                                prompt: "user says it is not a good time, they are busy, or asks to be called back",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-exit-od-success",
                    type: "subflow_end",
                    name: "Exit Component — Prospect Engaged",
                    skippable: false,
                    display_position: { x: 1250, y: 50 },
                },

                {
                    id: "ivr-exit-od-callback",
                    type: "subflow_end",
                    name: "Exit Component — Callback Requested",
                    skippable: false,
                    display_position: { x: 1250, y: 250 },
                },

                {
                    id: "ivr-exit-od-voicemail",
                    type: "subflow_end",
                    name: "Exit Component — Voicemail Or Failed",
                    skippable: false,
                    display_position: { x: 1250, y: 450 },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["subflowConfig"],
}