import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["ivr-navigation-payment-bot"]

export const TemplateIVRNavigationPaymentBot = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...template.config.generalTools,

            ({
                type: "custom",
                name: "submit_payment_log",
                description: "Submit the completed payment record once the IVR or representative has confirmed payment and a confirmation number has been obtained. Call this before end_call on a successful payment.",
                url: "https://template-agents-api.onrender.com/api/submit_payment_log",
                method: "POST",
                headers: {},
                query_params: {},
                parameter_type: "json",
                parameters: {
                    type: "object",
                    properties: {
                        account_number: {
                            type: "string",
                            description: "The account or invoice number entered into the IVR",
                        },
                        confirmation_number: {
                            type: "string",
                            description: "The confirmation or reference number provided by the IVR or representative. Use N/A if not provided.",
                        },
                        ivr_path_summary: {
                            type: "string",
                            description: "Brief summary of the IVR path navigated to reach the payment screen",
                        },
                        notes: {
                            type: "string",
                            description: "Any additional notes about the call, payment conditions, or follow-up needed",
                        },
                        paid_by: {
                            type: "string",
                            description: "Name of the paying organization",
                        },
                        payee_name: {
                            type: "string",
                            description: "Name of the company or vendor that was paid",
                        },
                        payment_amount: {
                            type: "number",
                            description: "The payment amount confirmed by the IVR or representative in dollars",
                        },
                        payment_completed_in_ivr: {
                            type: "boolean",
                            description: "Whether the payment was completed fully within the IVR without a human representative",
                        },
                        payment_method: {
                            type: "string",
                            description: "Payment method used: credit_card, debit_card, ach_checking, ach_savings",
                        },
                        representative_name: {
                            type: "string",
                            description: "Name of the human representative if payment was handled by a person. Otherwise null.",
                        },
                    },
                    required: [
                        "payee_name",
                        "account_number",
                        "payment_amount",
                        "payment_method",
                        "confirmation_number",
                        "paid_by",
                        "payment_completed_in_ivr",
                    ],
                },
                response_variables: {
                    payment_id: "payment_id",
                    payment_logged: "payment_logged",
                },
                timeout_ms: 20000,
                args_at_root: false,
                speak_after_execution: false,
                speak_during_execution: false,
            }) satisfies GeneralTool,

            ({
                type: "custom",
                name: "log_ivr_failure",
                description: "Log a failed payment attempt when the IVR cannot be navigated, the account is not found, the payment amount does not match, or a required detail is missing. Call this before end_call on any failure.",
                url: "https://template-agents-api.onrender.com/api/log_ivr_failure",
                method: "POST",
                headers: {},
                query_params: {},
                parameter_type: "json",
                parameters: {
                    type: "object",
                    properties: {
                        account_number: {
                            type: "string",
                            description: "The account or invoice number associated with this payment attempt",
                        },
                        failure_reason: {
                            type: "string",
                            description: "The reason the payment could not be completed: ivr_blocked, account_not_found, amount_mismatch, missing_info, after_hours, wrong_number, call_dropped, ivr_loop",
                        },
                        ivr_path_summary: {
                            type: "string",
                            description: "Brief summary of how far into the IVR the agent got before failing",
                        },
                        notes: {
                            type: "string",
                            description: "Any additional context about the failure",
                        },
                        payee_name: {
                            type: "string",
                            description: "Name of the company or vendor called",
                        },
                    },
                    required: [
                        "payee_name",
                        "account_number",
                        "failure_reason",
                    ],
                },
                response_variables: {
                    failure_id: "failure_id",
                    failure_logged: "failure_logged",
                },
                timeout_ms: 10000,
                args_at_root: false,
                speak_after_execution: false,
                speak_during_execution: false,
            }) satisfies GeneralTool,
        ] as GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Persona

You are **Riley**, an **Automated Payment Agent** calling on behalf of **Retell Corp**. You are built to call vendor, supplier, and utility payment lines, navigate their IVR systems, enter payment details accurately via DTMF or voice, and obtain a payment confirmation number.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 6, y: 222 },
            edge: {
                id: "begin-edge",
                destination_node_id: "comp-node-ivrpay-start-001",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "comp-node-ivrpay-start-001": {
            id: "comp-node-ivrpay-start-001",
            type: "subflow",
            name: "IVR Navigation And Initial Greeting",
            skippable: false,
            display_position: { x: 558, y: 174 },
            conversation_flow_component_id: "cf-comp-ivrpay-start-001",
            edges: [
                {
                    id: "comp-edge-ivrpay-success",
                    destination_node_id: "node-ivrpay-002",
                    transition_condition: {
                        type: "prompt",
                        prompt: "IVR or representative is ready for account or payment details or agrees",
                    },
                },
                {
                    id: "comp-edge-ivrpay-failure",
                    destination_node_id: "node-fn-logfailure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "IVR indicates wrong number, after-hours message plays, voicemail is reached, or IVR cannot be navigated",
                    },
                },
            ],
            else_edge: {
                id: "comp-else-edge-ivrpay",
                destination_node_id: "node-fn-logfailure",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ivrpay-002": {
            id: "node-ivrpay-002",
            type: "conversation",
            name: "Account Entry",
            skippable: false,
            display_position: { x: 1110, y: 102 },
            instruction: {
                type: "prompt",
                text: `When the IVR or representative asks for the account or invoice number:

Provide {{account_number}}

<*Wait for customer response*>

If the IVR reads back the account number, confirm it matches {{account_number}} before proceeding.

<*Wait for customer response*>

If the IVR cannot find the account after 2 attempts, transition to the failure node.`,
            },
            edges: [
                {
                    id: "edge-ivrpay-002-found",
                    destination_node_id: "node-ivrpay-003",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Account is found and confirmed by the IVR or representative",
                    },
                },
                {
                    id: "edge-ivrpay-002-notfound",
                    destination_node_id: "node-fn-logfailure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "IVR cannot find the account after 2 attempts",
                    },
                },
            ],
        },

        "node-ivrpay-003": {
            id: "node-ivrpay-003",
            type: "conversation",
            name: "Balance and Amount Confirmation",
            skippable: false,
            display_position: { x: 1662, y: 102 },
            instruction: {
                type: "prompt",
                text: `When the IVR reads back a balance or asks which amount to pay:

<*Wait for customer response*>

- If paying a specific amount, say {{payment_amount}}.
- If the IVR offers to pay the full balance and that matches {{payment_amount}}, confirm.
- If the amount read back does not match {{payment_amount}}, do not confirm — transition to the failure node immediately.

<*Wait for customer response*>`,
            },
            edges: [
                {
                    id: "edge-ivrpay-003-confirmed",
                    destination_node_id: "node-ivrpay-004",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Payment amount is confirmed by the IVR or representative and matches the expected amount",
                    },
                },
                {
                    id: "edge-ivrpay-003-mismatch",
                    destination_node_id: "node-fn-logfailure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Amount read back by IVR does not match the expected payment amount",
                    },
                },
            ],
        },

        "node-ivrpay-004": {
            id: "node-ivrpay-004",
            type: "conversation",
            name: "Payment Method Entry",
            skippable: false,
            display_position: { x: 2190, y: 6 },
            instruction: {
                type: "prompt",
                text: `Follow the IVR or representative's prompts to enter payment details.

If paying by card:
- Say the card number

<*Wait for customer response*>

- Say expiration date as prompted (MMYY unless otherwise specified)

<*Wait for customer response*>

- Provide CVV

<*Wait for customer response*>

- Provide billing zip code

If paying by bank account (ACH/eCheck):
- Provide routing number

<*Wait for customer response*>

- Provide bank account number

<*Wait for customer response*>

- Confirm account type if prompted (checking or savings)

If a human representative is taking the payment:
Provide information verbally one field at a time. Never volunteer card or bank numbers unprompted — only provide when explicitly asked.

<*Wait for customer response*>

If any required payment detail is missing from your data, transition to the failure node.`,
            },
            edges: [
                {
                    id: "edge-ivrpay-004-entered",
                    destination_node_id: "node-ivrpay-005",
                    transition_condition: {
                        type: "prompt",
                        prompt: "All payment method details have been entered and the IVR or representative is ready to confirm the payment",
                    },
                },
                {
                    id: "edge-ivrpay-004-missing",
                    destination_node_id: "node-fn-logfailure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "A required payment detail is missing and cannot be provided",
                    },
                },
            ],
        },

        "node-ivrpay-005": {
            id: "node-ivrpay-005",
            type: "conversation",
            name: "Payment Confirmation",
            skippable: false,
            display_position: { x: 2742, y: 78 },
            instruction: {
                type: "prompt",
                text: `When the IVR or representative reads back a payment summary:

<*Wait for customer response*>

- Confirm the amount matches {{payment_amount}}
- Confirm the account matches {{account_number}}
- Press the confirmation key or say "yes" / "confirm" as prompted

If any detail in the summary is wrong, do not confirm — transition to the failure node immediately.

<*Wait for customer response*>

Once payment is confirmed, listen for the confirmation or reference number.`,
            },
            edges: [
                {
                    id: "edge-ivrpay-005-confirmed",
                    destination_node_id: "node-ivrpay-006",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Payment is confirmed and the IVR or representative provides a confirmation or reference number",
                    },
                },
                {
                    id: "edge-ivrpay-005-declined",
                    destination_node_id: "node-fn-logfailure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Payment is declined, details do not match, or confirmation is refused",
                    },
                },
            ],
        },

        "node-ivrpay-006": {
            id: "node-ivrpay-006",
            type: "conversation",
            name: "Confirmation Number",
            skippable: false,
            display_position: { x: 3294, y: 102 },
            instruction: {
                type: "prompt",
                text: `Listen carefully for the confirmation or reference number provided by the IVR or representative.

<*Wait for customer response*>

If a human provides it, read it back character by character using the NATO Phonetic Alphabet to confirm accuracy.

<*Wait for customer response*>

If the IVR reads it out, note it carefully.

If no confirmation number is provided, note this — it will still be logged as N/A.

Once the confirmation number is noted, proceed to submit the payment log.`,
            },
            edges: [
                {
                    id: "edge-ivrpay-006-done",
                    destination_node_id: "node-fn-submitlog",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Confirmation number has been noted or confirmed as not provided",
                    },
                },
            ],
        },

        "node-fn-submitlog": {
            id: "node-fn-submitlog",
            type: "function",
            name: "Submit Payment Log",
            skippable: false,
            display_position: { x: 3846, y: 198 },
            edges: [
                {
                    id: "edge-fn-submitlog-done",
                    destination_node_id: "node-ivrpay-closing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Once the function is called, transition to next node.",
                    },
                },
            ],
            else_edge: {
                id: "node-fn-submitlog-else-edge",
                destination_node_id: "node-1774420456661",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ivrpay-closing": {
            id: "node-ivrpay-closing",
            type: "conversation",
            name: "Closing Message",
            skippable: false,
            display_position: { x: 4398, y: 222 },
            instruction: {
                type: "static_text",
                text: "Thanks so much — have a good one.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-ivrpay-closing",
                destination_node_id: "end-call-ivrpay-success",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-ivrpay-success": {
            id: "end-call-ivrpay-success",
            type: "end",
            name: "End Call — Success",
            skippable: false,
            display_position: { x: 4950, y: 222 },
            instruction: {
                type: "prompt",
                text: "End the call",
            },
        },

        "node-fn-logfailure": {
            id: "node-fn-logfailure",
            type: "function",
            name: "Log Ivr Failure",
            skippable: false,
            display_position: { x: 3294, y: 702 },
            edges: [
                {
                    id: "edge-fn-logfailure-done",
                    destination_node_id: "end-call-ivrpay-failure",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Once the function is called, transition to next node.",
                    },
                },
            ],
            else_edge: {
                id: "node-fn-logfailure-else-edge",
                destination_node_id: "end-call-ivrpay-failure",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "end-call-ivrpay-failure": {
            id: "end-call-ivrpay-failure",
            type: "end",
            name: "End Call — Failure",
            skippable: false,
            display_position: { x: 3846, y: 726 },
            instruction: {
                type: "prompt",
                text: "End the call without speaking.",
            },
        },

        "node-ivrpay-hold": {
            id: "node-ivrpay-hold",
            type: "conversation",
            name: "Hold — No Response Needed",
            skippable: false,
            display_position: { x: 6, y: 582 },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: `- The IVR or representative says "hold on", "one moment", "please wait", "please hold", or similar
- Hold music or periodic hold announcements are playing
- The line goes silent after a menu selection or transfer
- Any silence period longer than 2 seconds during IVR navigation`,
                },
            },
            instruction: {
                type: "static_text",
                text: "NO_RESPONSE_NEEDED",
            },
            edges: [],
        },

        "node-1774420456661": {
            id: "node-1774420456661",
            type: "conversation",
            name: "Conversation",
            skippable: false,
            display_position: { x: 4398, y: 558 },
            instruction: {
                type: "static_text",
                text: "Someone from my team may need to call back. Thanks!",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-1774420490508-ibidbzkfe",
                destination_node_id: "end-call-ivrpay-success",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {
        "cf-comp-ivrpay-start-001": {
            conversation_flow_component_id: "cf-comp-ivrpay-start-001",
            name: "IVR Navigation And Initial Greeting",
            flex_mode: true,

            nodes: [
                {
                    id: "ivr-subflow-start",
                    type: "subflow_start",
                    name: "Start",
                    skippable: false,
                    display_position: { x: -1200, y: 311 },
                    edge: {
                        id: "ivr-subflow-start-edge",
                        destination_node_id: "ivr-nav-listen",
                        transition_condition: {
                            type: "prompt",
                            prompt: "Start",
                        },
                    },
                },

                {
                    id: "ivr-nav-listen",
                    type: "conversation",
                    name: "IVR Navigation",
                    skippable: false,
                    display_position: { x: -713, y: 311 },
                    instruction: {
                        type: "prompt",
                        text: `The call has just connected. The IVR will speak first — do not say anything until spoken to.

Navigate toward:
- Pay a bill
- Make a payment
- Bill pay
- Account balance and payment

Avoid:
- Customer service
- New accounts
- Technical support
- Claims

If the IVR is DTMF-driven (says "press X for..."), transition to press the appropriate digit.
If the IVR is speech-driven or says "say or press", speak the response clearly and concisely (e.g., "make a payment" or "billing").

If placed on hold or told to wait, respond exactly with: NO_RESPONSE_NEEDED

Continue navigating until the payment section is reached or a live representative answers.

<*Wait for customer response*>`,
                    },
                    edges: [
                        {
                            id: "edge-nav-to-press",
                            destination_node_id: "ivr-nav-press",
                            transition_condition: {
                                type: "prompt",
                                prompt: "IVR presents a DTMF-only menu requiring a digit press",
                            },
                        },
                        {
                            id: "edge-nav-to-success",
                            destination_node_id: "ivr-exit-ivrpay-success-001",
                            transition_condition: {
                                type: "prompt",
                                prompt: "IVR reaches the payment or bill pay section and prompts for account or invoice number",
                            },
                        },
                        {
                            id: "edge-nav-to-greeting",
                            destination_node_id: "ivr-nav-greeting",
                            transition_condition: {
                                type: "prompt",
                                prompt: "A live representative answers and is ready to assist",
                            },
                        },
                        {
                            id: "edge-nav-to-failure",
                            destination_node_id: "ivr-exit-ivrpay-failure-001",
                            transition_condition: {
                                type: "prompt",
                                prompt: "After-hours message plays, wrong number, voicemail is reached, or IVR loops 3 or more times without progress",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-nav-press",
                    type: "press_digit",
                    name: "Press Navigation Digit",
                    skippable: false,
                    delay_ms: 800,
                    display_position: { x: -10, y: -24 },
                    instruction: {
                        type: "prompt",
                        text: `Press the digit that corresponds to billing, payments, pay a bill, or make a payment from the IVR menu options.

Do not press digits for customer service, new accounts, technical support, or claims.`,
                    },
                    edges: [
                        {
                            id: "edge-press-to-success",
                            destination_node_id: "ivr-exit-ivrpay-success-001",
                            transition_condition: {
                                type: "prompt",
                                prompt: "IVR reaches the payment or bill pay section and prompts for account or invoice number",
                            },
                        },
                        {
                            id: "edge-press-to-listen",
                            destination_node_id: "ivr-nav-listen",
                            transition_condition: {
                                type: "prompt",
                                prompt: "IVR presents another menu or continues navigation",
                            },
                        },
                        {
                            id: "edge-press-to-greeting",
                            destination_node_id: "ivr-nav-greeting",
                            transition_condition: {
                                type: "prompt",
                                prompt: "A live representative answers",
                            },
                        },
                        {
                            id: "edge-press-to-failure",
                            destination_node_id: "ivr-exit-ivrpay-failure-001",
                            transition_condition: {
                                type: "prompt",
                                prompt: "After-hours message, wrong number, voicemail, or IVR cannot proceed",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-nav-greeting",
                    type: "conversation",
                    name: "Initial Greeting",
                    skippable: false,
                    display_position: { x: 553, y: 529 },
                    instruction: {
                        type: "prompt",
                        text: `Provide a natural variation of:
> "I'd like to make a payment for {{payee_name}}, account number {{account_number}}."

<*Wait for customer response*>`,
                    },
                    edges: [
                        {
                            id: "edge-greeting-to-success",
                            destination_node_id: "ivr-exit-ivrpay-success-001",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Representative acknowledges and is ready for account or payment details",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-exit-ivrpay-success-001",
                    type: "subflow_end",
                    name: "Exit Component — Success",
                    skippable: false,
                    display_position: { x: 1200, y: 150 },
                },

                {
                    id: "ivr-exit-ivrpay-failure-001",
                    type: "subflow_end",
                    name: "Exit Component — Failure",
                    skippable: false,
                    display_position: { x: 1200, y: 350 },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["subflowConfig"],
}