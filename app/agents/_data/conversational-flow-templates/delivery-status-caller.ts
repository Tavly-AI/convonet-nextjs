import type { GeneralTool } from "../../_lib/functions/general-tools"
import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"

const template = getAgentTemplates()["delivery-status-caller"]

export const TemplateDeliveryStatusCaller = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...template.config.generalTools,
            {
                name: "transfer_call",
                type: "transfer_call" as const,
                description:
                    "Transfer the call if the caller is angry or upset, requests a human agent, or repeatedly asks for assistance unrelated to package delivery.",
                transfer_destination: {
                    type: "predefined" as const,
                    number: "+18004377950",
                },
                transfer_option: {
                    type: "cold_transfer" as const,
                    cold_transfer_mode: "sip_invite" as const,
                    show_transferee_as_caller: true,

                },

                speak_during_execution: true,
                execution_message_type: "static_text" as const,
                execution_message_description: "One moment while I transfer you.",
            },

        ] as GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Identity
You are Jordan, a digital assistant for BrightShip Delivery, responsible for helping customers check delivery status and shipment updates.

## Important: Function Step Discipline
After check_delivery_status is called, you MUST use the status information returned before speaking.

Do not describe or summarize a status you have not yet retrieved.

If the function has not been called, do not reference any delivery status — call the function first.

Possible delivery statuses:
- Label created
- Shipment picked up
- In transit
- At local delivery facility
- Out for delivery
- Delivered
- Delivery attempted
- Delivery delayed

## Hold / Pause Handling
If the caller says "hold on", "one moment", or "please wait":
Respond with exactly: NO_RESPONSE_NEEDED

## Voice Agent Response Guidelines
Every response follows:
Ack + Statement + Next Step

Acknowledgments are optional.
Maximum 2 acknowledgments every 5 turns.

Approved phrases:
"Yes", "Yeah", "Okay", "All right", "Sure", "Got it",
"My apologies", "I'm sorry", "Thanks", "Thanks for checking"

Banned phrases:
"Certainly!", "Absolutely!", "Of course!", "Great question!",
"Thanks for letting me know!", "I'd be happy to assist you with that today!",
"Understood.", "Thanks for clarifying."

## Statements
- Keep concise and conversational
- Avoid long explanations
- Vary sentence length
- Provide one step at a time

## Next Step Phrases
Rotate:
"Is that correct?"
"Does that look right?"
"Let me know if that works."
"Would you like me to check anything else?"
"Can you confirm that?"

## FAQs

Q: When will my package arrive?
A: The estimated delivery date is based on the latest transit updates and may change depending on processing and routing.

Q: What does "out for delivery" mean?
A: It means the package is on a delivery vehicle and expected to arrive that day.

Q: What if my delivery is delayed?
A: Delays can happen due to weather, logistics, or processing times. Updated estimates will appear in the tracking system.

Q: What if my package says delivered but I cannot find it?
A: We can start a delivery investigation to locate the package or verify delivery details.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 6, y: 78 },
            edge: {
                id: "begin-edge",
                destination_node_id: "start-node-delivery-001",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "start-node-delivery-001": {
            id: "start-node-delivery-001",
            type: "conversation",
            name: "Greeting",
            start_speaker: "agent",
            instruction: {
                type: "static_text",
                text: "Thank you for calling BrightShip delivery support. This is Jordan. How can I help you today?",
            },
            display_position: { x: 558, y: -18 },
            edges: [
                {
                    id: "edge-delivery-001-status",
                    destination_node_id: "node-delivery-collect",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to check delivery status, track a package, or asks where their package is",
                    },
                },
                {
                    id: "edge-delivery-001-missing",
                    destination_node_id: "node-delivery-missing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller reports their package is missing, was not delivered, or cannot be found",
                    },
                },
                {
                    id: "edge-delivery-001-unclear",
                    destination_node_id: "node-delivery-intent",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller intent is unclear or they ask a general question",
                    },
                },
            ],
            skippable: false,
        },

        "node-delivery-intent": {
            id: "node-delivery-intent",
            type: "conversation",
            name: "Identify Intent",
            instruction: {
                type: "prompt",
                text: `The caller's intent is not yet clear.

Ask:
"Are you calling to check the delivery status of a package?"

<wait for response>

If user's intent is not related to package status, clarify that you can only help with package delivery-related requests.`,
            },
            display_position: { x: 1110, y: 918 },
            edges: [
                {
                    id: "edge-intent-yes",
                    destination_node_id: "node-delivery-collect",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms they want to check delivery status",
                    },
                },
                {
                    id: "edge-intent-missing",
                    destination_node_id: "node-delivery-missing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller reports a missing or undelivered package",
                    },
                },
            ],
            skippable: false,
        },

        "node-delivery-collect": {
            id: "node-delivery-collect",
            type: "conversation",
            name: "Collect Delivery Identifier",
            instruction: {
                type: "prompt",
                text: `Ask the caller for their tracking number or delivery ID:

"May I have the tracking number or delivery ID?"

<wait for response>

If the caller does not have it, ask:

"No problem. May I have the name on the delivery?"

<wait for response>

Optional follow-up:

"Is the phone number you are calling from associated with the delivery?"

<wait for response>`,
            },
            display_position: { x: 1662, y: 462 },
            edges: [
                {
                    id: "edge-collect-provided",
                    destination_node_id: "node-delivery-confirm",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides a tracking number, delivery ID, or name on the delivery",
                    },
                },
            ],
            skippable: false,
        },

        "node-delivery-confirm": {
            id: "node-delivery-confirm",
            type: "conversation",
            name: "Confirm Identifier",
            instruction: {
                type: "prompt",
                text: `Repeat the identifier back to confirm accuracy.

If a tracking number was provided:
"So to confirm, the tracking number is [TRACKING NUMBER], correct?"

If a delivery ID was provided:
"Just to confirm, the delivery ID is [DELIVERY ID], right?"

If a name was provided:
"So the delivery is under the name [NAME], correct?"

<wait for confirmation>`,
            },
            display_position: { x: 2190, y: 438 },
            edges: [
                {
                    id: "edge-confirm-correct",
                    destination_node_id: "node-fn-checkstatus",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms the identifier is correct",
                    },
                },
                {
                    id: "edge-confirm-retry",
                    destination_node_id: "node-delivery-collect",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller corrects the identifier — it was wrong",
                    },
                },
            ],
            skippable: false,
        },

        "node-fn-checkstatus": {
            id: "node-fn-checkstatus",
            type: "function",
            name: "Check Delivery Status",

            // tool_id: "tool-deliverystatus-check01",
            // tool_type: "local",

            // instruction: {
            //     type: "static_text",
            //     text: "Let me look that up for you.",
            // },

            // wait_for_result: true,
            // speak_during_execution: true,

            display_position: { x: 2742, y: 558 },

            edges: [],

            else_edge: {
                id: "node-fn-checkstatus-else-edge",
                destination_node_id: "node-delivery-status",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },

            skippable: false,
        },

        "node-delivery-status": {
            id: "node-delivery-status",
            type: "conversation",
            name: "Provide Delivery Status",
            instruction: {
                type: "prompt",
                text: `Provide the most recent delivery status returned by check_delivery_status.

Do not describe a status you have not retrieved.

Status responses:

- In transit → "I see that your package is currently in transit."

- At local delivery facility → "Your package has arrived at a local delivery facility."

- Out for delivery → "Your package is out for delivery and is expected to arrive later today."

- Delivered → "The system shows your package was delivered on [DATE] at [TIME]. Would you like the delivery location details?"

- Delivery attempted → "It looks like a delivery attempt was made. Would you like next steps on rescheduling?"

- Delivery delayed → "It looks like the delivery is currently delayed. The updated estimated delivery date is [DATE]. Would you like me to check for additional updates?"

- Label created → "A shipping label has been created for your package."

- Shipment picked up → "Your package has been picked up and is moving through the delivery network."

Only mention dates and times if returned by the tool.

After providing the status, ask:
"Would you like me to check anything else?"

<wait for response>`,
            },
            display_position: { x: 3294, y: 270 },
            edges: [
                {
                    id: "edge-status-done",
                    destination_node_id: "end-call-delivery",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms they have what they need and does not require further assistance",
                    },
                },
                {
                    id: "edge-status-another",
                    destination_node_id: "node-delivery-collect",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to check another package or a different tracking number",
                    },
                },
                {
                    id: "edge-status-missing",
                    destination_node_id: "node-delivery-missing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller says the package shows delivered but they cannot find it, or reports it as missing after hearing the status",
                    },
                },
            ],
            skippable: false,
        },

        "node-delivery-missing": {
            id: "node-delivery-missing",
            type: "conversation",
            name: "Missing or Undelivered Package",
            instruction: {
                type: "prompt",
                text: `The caller is reporting a missing or undelivered package.

Ask:

"Would you like me to start a delivery investigation for this package?"

<wait for response>

If yes:

"Could you briefly describe what happened with the delivery?"

<wait for response>`,
            },
            display_position: { x: 3846, y: 942 },
            edges: [
                {
                    id: "edge-missing-yes",
                    destination_node_id: "node-delivery-investigation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller agrees to start an investigation and provides a description of the issue",
                    },
                },
                {
                    id: "edge-missing-no",
                    destination_node_id: "end-call-delivery",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller declines an investigation and does not need further help",
                    },
                },
            ],
            skippable: false,
        },

        "node-delivery-investigation": {
            id: "node-delivery-investigation",
            type: "conversation",
            name: "Investigation Confirmation",
            instruction: {
                type: "prompt",
                text: `Confirm the caller's delivery investigation request has been noted.

Say:

"I've noted the details of your delivery issue. Our team will need to review the delivery information."

Do not claim an investigation has been submitted unless a backend or tool has actually created one.

Ask:

"Is there anything else I can help you with today?"

<wait for response>`,
            },
            display_position: { x: 4398, y: 1206 },
            edges: [
                {
                    id: "edge-investigation-done",
                    destination_node_id: "end-call-delivery",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms they have what they need",
                    },
                },
                {
                    id: "edge-investigation-another",
                    destination_node_id: "node-delivery-collect",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to check another package",
                    },
                },
            ],
            skippable: false,
        },

        "end-call-delivery": {
            id: "end-call-delivery",
            type: "end",
            name: "End Call",
            instruction: {
                type: "static_text",
                text: "Thanks for calling BrightShip delivery support. Have a great day!",
            },
            // speak_during_execution: true,
            display_position: { x: 4950, y: 1014 },
            skippable: false,
        },

        "node-1775431575365": {
            id: "node-1775431575365",
            type: "transfer_call",
            name: "Transfer Call",
            display_position: { x: 6, y: 438 },
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
            speak_during_execution: true,
            custom_sip_headers: {},
            skippable: false,
            edge: {
                id: "edge-1775431575365-rncpr5x85",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {},
}