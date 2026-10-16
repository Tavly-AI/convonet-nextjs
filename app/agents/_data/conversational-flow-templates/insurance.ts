import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["insurance"]

export const TemplateInsurance = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...template.config.generalTools,

            {
                type: "custom",
                name: "lookup_patient_record",
                description: "Retrieve the patient's internal case record once the insurance representative has confirmed the patient's identity. Returns the case ID needed for logging the verification.",
                url: "https://template-agents-api.onrender.com/api/lookup_patient_record",
                method: "GET",
                headers: {},
                query_params: {
                    group_number: "{{group_number}}",
                    member_id: "{{member_id}}",
                    patient_dob: "{{patient_dob}}",
                    patient_first_name: "{{patient_first_name}}",
                    patient_last_name: "{{patient_last_name}}",
                },
                parameter_type: "json",
                parameters: {
                    type: "object",
                    properties: {
                        date_of_birth: {
                            type: "string",
                            description: "The patient's date of birth in YYYY-MM-DD format",
                        },
                        member_id: {
                            type: "string",
                            description: "The patient's insurance member ID",
                        },
                        patient_last_name: {
                            type: "string",
                            description: "The patient's last name",
                        },
                    },
                    required: [
                        "member_id",
                        "patient_last_name",
                        "date_of_birth",
                    ],
                },
                response_variables: {
                    found_record: "found_record",
                    patient_id: "patient_id",
                },
                timeout_ms: 15000,
                args_at_root: false,
                speak_after_execution: false,
                speak_during_execution: false,
            },

            {
                type: "custom",
                name: "submit_verification",
                description: "Submit the completed insurance benefit verification after all details have been collected and confirmed with the representative. Call this before ending the call.",
                url: "https://template-agents-api.onrender.com/api/submit_verification",
                method: "POST",
                headers: {},
                query_params: {},
                parameter_type: "json",
                parameters: {
                    type: "object",
                    properties: {
                        authorization_number: {
                            type: ["string", "null"],
                            description: "The prior authorization number if applicable, otherwise null",
                        },
                        case_id: {
                            type: "string",
                            description: "The case ID returned from lookup_patient_record",
                        },
                        copay_or_coinsurance: {
                            type: "string",
                            description: "The copay amount or coinsurance percentage that applies to the specified service type",
                        },
                        coverage_active: {
                            type: "boolean",
                            description: "Whether the patient's coverage is currently active",
                        },
                        deductible_met: {
                            type: "number",
                            description: "How much of the in-network deductible has been met in dollars",
                        },
                        in_network_deductible: {
                            type: "number",
                            description: "The patient's in-network annual deductible in dollars",
                        },
                        oop_met: {
                            type: "number",
                            description: "How much of the out-of-pocket maximum has been met in dollars",
                        },
                        out_of_pocket_max: {
                            type: "number",
                            description: "The patient's in-network out-of-pocket maximum in dollars",
                        },
                        prior_auth_required: {
                            type: "boolean",
                            description: "Whether prior authorization is required for the specified service type",
                        },
                        reference_number: {
                            type: "string",
                            description: "Call reference, confirmation, or tracking number provided by the representative",
                        },
                        rep_name: {
                            type: "string",
                            description: "Full name of the insurance representative spoken with",
                        },
                        service_type: {
                            type: "string",
                            description: "The service type being verified",
                        },
                    },
                    required: [
                        "case_id",
                        "coverage_active",
                        "in_network_deductible",
                        "deductible_met",
                        "out_of_pocket_max",
                        "oop_met",
                        "service_type",
                        "copay_or_coinsurance",
                        "prior_auth_required",
                        "rep_name",
                        "reference_number",
                    ],
                },
                response_variables: {
                    verification_id: "verification_id",
                    verification_success: "verification_success",
                },
                timeout_ms: 20000,
                args_at_root: false,
                speak_after_execution: false,
                speak_during_execution: false,
            },
        ] as GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Role

You are **Alex**, an **Insurance Verification Specialist** calling on behalf of **Retell Clinic**. You are an AI-powered voice agent built to call insurance payer lines, navigate IVR systems, authenticate as a calling provider, and collect patient benefit information efficiently and accurately.

## Context

You are placing outbound calls to insurance payer phone lines. The person on the other end is an insurance company representative, not a patient. You are verifying benefits for a patient at Retell Clinic.

## Hold / Pause Handling
If you are told:
• “Hold on”
• “One moment”
• “Please wait”
• Or similar

You must respond with exactly:
NO_RESPONSE_NEEDED`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: {
                x: 6,
                y: 270,
            },
            edge: {
                id: "begin-edge",
                destination_node_id: "comp-node-ivr-auth",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "comp-node-ivr-auth": {
            id: "comp-node-ivr-auth",
            type: "subflow",
            name: "IVR Navigation And Provider Auth",
            conversation_flow_component_id: "cf-component-1776294427578",
            display_position: {
                x: 534,
                y: 222,
            },
            skippable: false,
            edges: [
                {
                    id: "comp-edge-success",
                    destination_node_id: "node-1773414100003",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Representative acknowledges the provider or asks for patient information",
                    },
                },
                {
                    id: "comp-edge-failure",
                    destination_node_id: "node-1773414100009",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The IVR explicitly states the wrong company, plays an after-hours or office-closed message, or reaches a voicemail greeting",
                    },
                },
            ],
            else_edge: {
                id: "comp-else-edge",
                destination_node_id: "node-1773414100009",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-1773414100003": {
            id: "node-1773414100003",
            type: "conversation",
            name: "Patient Verification",
            skippable: false,
            display_position: {
                x: 1110,
                y: 150,
            },
            instruction: {
                type: "prompt",
                text: `Provide the following patient details as the representative requests them:

- Patient name: {{patient_first_name}} {{patient_last_name}}
- Date of birth: {{patient_dob}}
- Member ID: {{member_id}}
- Group number: {{group_number}}

<*Wait for customer response*>

If the representative reads back a member ID or any alphanumeric string, confirm it character by character using the NATO Phonetic Alphabet.

<*Wait for customer response*>

Once the representative confirms the patient's identity, proceed.`,
            },
            edges: [
                {
                    id: "edge-1773414100003-confirmed",
                    destination_node_id: "node-fn-lookup-1773414100004",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Representative confirms the patient's identity",
                    },
                },
            ],
        },

        "node-fn-lookup-1773414100004": {
            id: "node-fn-lookup-1773414100004",
            type: "function",
            name: "Lookup Patient Record",
            skippable: false,
            display_position: {
                x: 1662,
                y: 246,
            },

            // tool_id: "tool-insuranceverif-lookup01",
            // tool_type: "local",
            // speak_during_execution: false,
            // wait_for_result: true,

            edges: [
                {
                    id: "edge-fn-lookup-success",
                    destination_node_id: "node-1773414100005",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Once the function is called, transition to next node.",
                    },
                },
            ],
            else_edge: {
                id: "node-fn-lookup-1773414100004-else-edge",
                destination_node_id: "node-1774411529048",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-1773414100005": {
            id: "node-1773414100005",
            type: "conversation",
            name: "Benefits Collection",
            skippable: false,
            display_position: {
                x: 2190,
                y: 6,
            },
            instruction: {
                type: "prompt",
                text: `Ask the following questions one at a time. Wait for a full response before asking the next.

### Step 1: Check Eligibility

Provide a natural variation of:
> "Is the patient currently active and eligible as of today?"

<*Wait for customer response*>

### Step 2: In-Network Deductible

Provide a natural variation of:
> "What's the in-network deductible, and how much has been met?"

<*Wait for customer response*>

### Step 3: Out-Of-Pocket Maximum

Provide a natural variation of:
> "What's the out-of-pocket maximum, and how much has been met?"

<*Wait for customer response*>

### Step 4: Copay Or Coinsurance

Provide a natural variation of:
> "What's the copay or coinsurance for {{service_type}}?"

<*Wait for customer response*>

### Step 5: Prior Authorization

Provide a natural variation of:
> "Is a prior authorization required for this service?"

<*Wait for customer response*>

### Step 6: Authorization Number (If Required)

If prior auth is required, provide a natural variation of:
> "Can I get that authorization number?"

<*Wait for customer response*>

When the representative gives an auth number or reference ID, read it back using the NATO Phonetic Alphabet to confirm accuracy.`,
            },
            edges: [
                {
                    id: "edge-1773414100005-collected",
                    destination_node_id: "node-1773414100006",
                    transition_condition: {
                        type: "prompt",
                        prompt: "All benefit questions have been answered including eligibility, deductible, out-of-pocket max, copay or coinsurance, and prior authorization status",
                    },
                },
            ],
        },

        "node-1773414100006": {
            id: "node-1773414100006",
            type: "conversation",
            name: "Summary Confirmation",
            skippable: false,
            display_position: {
                x: 2742,
                y: 126,
            },
            instruction: {
                type: "prompt",
                text: `Read back the full benefit summary to the representative to confirm accuracy.

### Step 1: Read Back Summary

Respond exactly with:
> "Just to confirm — {{patient_first_name}} {{patient_last_name}} is [active/inactive], in-network deductible is [amount] with [amount] met, out-of-pocket max is [amount] with [amount] met, [copay/coinsurance] applies to {{service_type}}, and prior auth [is / is not] required. Is that all correct?"

<*Wait for customer response*>

### Step 2: Collect Rep Details

Provide a natural variation of:
> "What is your name, and can I get a reference number for this call?"

<*Wait for customer response*>`,
            },
            edges: [
                {
                    id: "edge-1773414100006-confirmed",
                    destination_node_id: "node-fn-submit-1773414100007",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Representative confirms the summary and provides their name and a call reference number",
                    },
                },
            ],
        },

        "node-fn-submit-1773414100007": {
            id: "node-fn-submit-1773414100007",
            type: "function",
            name: "Submit Verification",
            skippable: false,
            display_position: {
                x: 3294,
                y: 246,
            },

            // tool_id: "tool-insuranceverif-submit01",
            // tool_type: "local",
            // speak_during_execution: false,
            // wait_for_result: true,

            edges: [
                {
                    id: "edge-fn-submit-done",
                    destination_node_id: "node-1773414100008",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Once the function is called, transition to next node.",
                    },
                },
            ],
            else_edge: {
                id: "node-fn-submit-1773414100007-else-edge",
                destination_node_id: "node-1774411582763",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-1773414100008": {
            id: "node-1773414100008",
            type: "conversation",
            name: "Closing Message",
            skippable: false,
            display_position: {
                x: 3846,
                y: 270,
            },
            instruction: {
                type: "static_text",
                text: "Thank you for providing that information. Our team will review it and contact you shortly.",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-1773414100008-close",
                destination_node_id: "end-call-node-success",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-node-success": {
            id: "end-call-node-success",
            type: "end",
            name: "End Call — Success",
            skippable: false,
            display_position: {
                x: 4398,
                y: 270,
            },
            instruction: {
                type: "prompt",
                text: "End the call",
            },
        },

        "node-1773414100009": {
            id: "node-1773414100009",
            type: "conversation",
            name: "Failure Close Message",
            skippable: false,
            display_position: {
                x: 1110,
                y: 750,
            },
            instruction: {
                type: "prompt",
                text: `Politely close the call based on the reason.

- If wrong company:
  Respond exactly with:
  > "Sorry about that — have a good day."

- If after hours:
  Respond exactly with:
  > "Sounds like the office is closed — we'll try again during business hours."

- If voicemail reached: Do not leave a message. End the call silently.

- If IVR cannot be navigated: End the call without speaking.`,
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-1773414100009-fail",
                destination_node_id: "end-call-node-failure",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "end-call-node-failure": {
            id: "end-call-node-failure",
            type: "end",
            name: "End Call — Failure",
            skippable: false,
            display_position: {
                x: 1590,
                y: 750,
            },
            instruction: {
                type: "prompt",
                text: "End the call",
            },
        },

        "node-1774411529048": {
            id: "node-1774411529048",
            type: "conversation",
            name: "Conversation",
            skippable: false,
            display_position: {
                x: 2046,
                y: 726,
            },
            instruction: {
                type: "prompt",
                text: "Inform that this patient is not a part of this clinic ",
            },
            edges: [],
            always_edge: {
                id: "always-edge-1774411558041-fj0ctaf43",
                destination_node_id: "node-1774411560948",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node-1774411560948": {
            id: "node-1774411560948",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: {
                x: 2742,
                y: 894,
            },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
            // speak_during_execution: true,
        },

        "node-1774411582763": {
            id: "node-1774411582763",
            type: "conversation",
            name: "Conversation",
            skippable: false,
            display_position: {
                x: 3846,
                y: 630,
            },
            instruction: {
                type: "static_text",
                text: "There was an error with our system, someone will follow up with you shortly",
            },
            edges: [],
            always_edge: {
                id: "skip-response-edge-1774411617986-jewl4rkdm",
                destination_node_id: "end-call-node-success",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {
        "cf-component-1776294427578": {
            name: "IVR Navigation And Provider Auth",
            conversation_flow_component_id: "cf-component-1776294427578",

            nodes: [
                {
                    id: "ivr-subflow-start",
                    type: "subflow_start",
                    name: "Start",
                    skippable: false,
                    display_position: {
                        x: -300,
                        y: 0,
                    },
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
                    start_speaker: "user",
                    display_position: { x: 0, y: 400 },
                    instruction: {
                        type: "prompt",
                        text: `The call has just connected. The IVR will speak first — do not say anything until spoken to.

Navigate toward Eligibility and Benefits, then Provider Services, then Authorizations / Prior Auth. Select Claims only if none of those are available. If asked member or provider, select provider.

Avoid member services, billing or payments, medical records, pharmacy, clinical departments, and new enrollment.

If the IVR is DTMF-driven (says "press X for..."), transition to press the appropriate digit.
If the IVR is speech-driven or says "say or press", speak the response clearly and concisely (e.g., "eligibility and benefits" or "provider services").
If no option clearly matches, select the most general option.

If placed on hold or told to wait, respond exactly with: NO_RESPONSE_NEEDED

Continue navigating until an automated eligibility response begins or a live representative answers.

<*Wait for customer response*>`,
                    },
                    edges: [
                        {
                            id: "edge-nav-to-press",
                            destination_node_id: "ivr-press-digit-node",
                            transition_condition: {
                                type: "prompt",
                                prompt: "IVR presents a DTMF-only menu requiring a digit press",
                            },
                        },
                        {
                            id: "edge-nav-to-human",
                            destination_node_id: "ivr-provider-auth",
                            transition_condition: {
                                type: "prompt",
                                prompt: "A live representative answers and is ready to assist, or an automated eligibility response begins",
                            },
                        },
                        {
                            id: "edge-nav-to-failure",
                            destination_node_id: "ivr-exit-failure",
                            transition_condition: {
                                type: "prompt",
                                prompt: "The IVR explicitly states the wrong company, plays an after-hours or office-closed message, or reaches a voicemail greeting",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-press-digit-node",
                    type: "press_digit",
                    name: "IVR Navigation",
                    skippable: false,
                    delay_ms: 1000,
                    display_position: {
                        x: 200,
                        y: 0,
                    },
                    instruction: {
                        type: "prompt",
                        text: `Navigate the IVR toward the correct department.

## Target Options (In Priority Order):
1. Eligibility and Benefits — e.g. "benefits", "eligibility", "coverage", "insurance"
2. Provider Services — e.g. "provider", "provider line"
3. Authorizations / Prior Auth — e.g. "authorizations", "pre-certification"
4. Claims — only if none of the above are available
5. If asked member or provider — select provider

## Avoid:
- Member Services / patient-facing lines
- Billing or payments
- Medical Records
- Pharmacy
- Clinical departments
- New enrollment

If no option clearly matches, select the most general option (e.g. "all other inquiries", "other", "general").
If asked for NPI, press digits for {{provider_npi}}.`,
                    },
                    edges: [
                        {
                            id: "edge-press-to-human",
                            destination_node_id: "ivr-provider-auth",
                            transition_condition: {
                                type: "prompt",
                                prompt: "A live representative answers, the system says please hold or transferring, or an automated eligibility response begins",
                            },
                        },
                        {
                            id: "edge-press-to-failure",
                            destination_node_id: "ivr-exit-failure",
                            transition_condition: {
                                type: "prompt",
                                prompt: "The IVR explicitly states the wrong company, plays an after-hours or office-closed message, or reaches a voicemail greeting",
                            },
                        },
                    ],
                },

                {
                    id: "ivr-provider-auth",
                    type: "conversation",
                    name: "Provider Authentication",
                    skippable: false,
                    display_position: {
                        x: 1030,
                        y: 382,
                    },
                    instruction: {
                        type: "static_text",
                        text: "Hi, I'm calling on behalf of Retell Clinic. Our NPI is {{provider_npi}}. I'm calling to verify benefits for one of our patients.",
                    },
                    edges: [],
                    always_edge: {
                        id: "edge-auth-skip-to-success",
                        destination_node_id: "ivr-exit-success",
                        transition_condition: {
                            type: "prompt",
                            prompt: "Skip response",
                        },
                    },
                },

                {
                    id: "ivr-exit-success",
                    type: "subflow_end",
                    name: "Exit Component",
                    skippable: false,
                    display_position: {
                        x: 2081,
                        y: 521,
                    },
                },

                {
                    id: "ivr-exit-failure",
                    type: "subflow_end",
                    name: "Exit Component — Failure",
                    skippable: false,
                    display_position: {
                        x: 1836,
                        y: -26,
                    },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["subflowConfig"],
}