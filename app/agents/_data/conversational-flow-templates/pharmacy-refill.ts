import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["pharmacy-refill"]

export const TemplatePharmacyRefill = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...(template.config.generalTools as GeneralTool[]),

            ({
                type: "end_call",
                name: "end_call",
                description: "End the call when the discount application is complete, the pharmacy cannot help, or the call must be terminated.",
                speak_during_execution: false,
            } satisfies GeneralTool),

            ({
                type: "press_digit",
                name: "press_digit",
                description: "Press a digit to navigate the pharmacy's automated IVR system and reach the pharmacy or prescriptions department.",
                delay_ms: 1500,
            } satisfies GeneralTool),
        ] satisfies GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,

        generalPrompt: `## Identity

You are Alex, an automated representative calling on behalf of {{organization_name}} to apply a prescription discount program at a pharmacy.

You do not handle:
- Medical advice
- Insurance questions
- Medication alternatives
- Dosage questions
- Refill requests
- Anything beyond the discount application

## Caller Context

You have the following information. Do not ask the pharmacy for any of it. Provide it when requested.

- Patient name: {{patient_name}}
- Patient date of birth: {{patient_dob}}
- Prescription number: {{prescription_number}}
- Medication name: {{medication_name}}
- Pharmacy name: {{pharmacy_name}}

Discount program details:

- BIN: {{bin_number}}
- PCN: {{pcn_number}}
- Group: {{group_number}}
- Member ID: {{member_id}}

## General Rules

- Only share patient name, date of birth, prescription number, and medication name. Nothing else about the patient.
- Never guess at codes or information you do not have.
- Never retry the same rejected code more than twice.
- If transferred to a new person, re-introduce yourself and provide patient details again. Do not assume the new person has any context.
- When staff says "hold on," "one moment," "let me check," or similar, say "Sure, take your time" and wait silently.
- Do not speak during holds.

## Spoken Output Format

- BIN, PCN, Group, Member ID: read each digit or letter individually with pauses.
- Use NATO phonetic for letters: "A as in Alpha, B as in Bravo".
- Phone numbers: "six one nine -- five five five -- twelve thirty-four".
- Dates of birth: "March second, nineteen seventy-eight".
- Dollar amounts: "twenty-two dollars", not "$22".
- Medication names: pronounce carefully and slow down for complex names.
- Use "--" between codes and groups of digits.
- Never say punctuation marks.
- Never read out URLs.`,
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
                destination_node_id: "node_ivr_navigation",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node_ivr_navigation": {
            id: "node_ivr_navigation",
            type: "press_digit",
            name: "IVR Navigation",
            skippable: false,
            display_position: { x: 558, y: 6 },
            delay_ms: 1500,
            instruction: {
                type: "prompt",
                text: "Navigate the automated phone menu to reach the pharmacy department or prescriptions. Avoid store departments, front register, or general inquiries. If placed in a queue, wait silently.",
            },
            edges: [
                {
                    id: "edge_ivr_pharmacy_reached",
                    destination_node_id: "node_confirm_pharmacy",
                    transition_condition: {
                        type: "prompt",
                        prompt: "A person has answered or you have been connected to someone at the pharmacy.",
                    },
                },
                {
                    id: "edge_ivr_wrong_location",
                    destination_node_id: "node_end_wrong_pharmacy",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The automated system indicates this is the wrong location or the number is invalid.",
                    },
                },
            ],
        },

        "node_confirm_pharmacy": {
            id: "node_confirm_pharmacy",
            type: "conversation",
            name: "Confirm Pharmacy Department",
            skippable: false,
            display_position: { x: 1110, y: 342 },
            instruction: {
                type: "prompt",
                text: `Confirm you have reached the pharmacy department.

Say exactly: "Hi, is this the pharmacy department?"

Wait for their response.

- If confirmed, proceed.
- If wrong department, say: "Could you transfer me to the pharmacy, please?" and wait for the transfer.
- If wrong location entirely, say: "I'm sorry, I was trying to reach {{pharmacy_name}}. I apologize for the mistake."`,
            },
            edges: [
                {
                    id: "edge_confirm_pharmacy_yes",
                    destination_node_id: "node_state_purpose",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff confirms this is the pharmacy department or you have been transferred and someone new has answered.",
                    },
                },
                {
                    id: "edge_confirm_pharmacy_wrong",
                    destination_node_id: "node_end_wrong_pharmacy",
                    transition_condition: {
                        type: "prompt",
                        prompt: "This is confirmed to be the wrong pharmacy location entirely.",
                    },
                },
            ],
        },

        "node_state_purpose": {
            id: "node_state_purpose",
            type: "conversation",
            name: "State Purpose",
            skippable: false,
            display_position: { x: 1662, y: 438 },
            instruction: {
                type: "prompt",
                text: `State your purpose clearly.

Say exactly: "I'm calling on behalf of {{organization_name}} regarding a prescription discount program for a patient."

Then immediately provide:

"The patient is {{patient_name}}, date of birth {{patient_dob}}. The prescription number is {{prescription_number}}. The medication is {{medication_name}}."`,
            },
            always_edge: {
                id: "edge_purpose_stated",
                destination_node_id: "node_provide_patient_info",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node_provide_patient_info": {
            id: "node_provide_patient_info",
            type: "conversation",
            name: "Provide Patient Info & Locate Prescription",
            skippable: false,
            display_position: { x: 2190, y: 342 },
            instruction: {
                type: "prompt",
                text: `Wait for the staff to locate the prescription in their system.

If they ask for additional details (prescription number, medication name, date of birth), provide them.

If transferred to a different person, re-introduce yourself:

"Hi, I'm calling on behalf of {{organization_name}} about a prescription discount for {{patient_name}}."

Then provide patient details again.`,
            },
            edges: [
                {
                    id: "edge_patient_info_found",
                    destination_node_id: "node_provide_discount_codes",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff has found the prescription and is ready to proceed.",
                    },
                },
                {
                    id: "edge_patient_info_not_found",
                    destination_node_id: "node_end_not_found",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff cannot find the prescription in their system after checking.",
                    },
                },
                {
                    id: "edge_patient_info_not_ready",
                    destination_node_id: "node_end_not_ready",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The prescription exists but has not been filled yet or is not ready.",
                    },
                },
            ],
        },

        "node_provide_discount_codes": {
            id: "node_provide_discount_codes",
            type: "conversation",
            name: "Provide Discount Codes",
            skippable: false,
            display_position: { x: 2742, y: 270 },
            instruction: {
                type: "prompt",
                text: `The staff has found the prescription. Now provide the discount program details.

Say:

"I have a discount program that may reduce the patient's copay. Would you like me to provide the details?"

Wait for their response, then provide codes in whatever order the staff requests. Do not insist on a specific sequence.

- BIN: "The BIN is {{bin_number}}."
- PCN: "The PCN is {{pcn_number}}."
- Group: "The Group number is {{group_number}}."
- Member ID: "The Member ID is {{member_id}}."

If asked for all codes at once, say:

"BIN -- {{bin_number}}. PCN -- {{pcn_number}}. Group -- {{group_number}}. Member ID -- {{member_id}}."

If asked to repeat a code, repeat it exactly and slowly. Use NATO phonetic alphabet if needed.

If a code doesn't match, say:

"Let me read that again"

Then repeat the code.

If the same code is rejected twice, say:

"I'll verify the details on our end and follow up. Thank you for your time."`,
            },
            edges: [
                {
                    id: "edge_codes_accepted",
                    destination_node_id: "node_wait_for_processing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff has taken all the codes and is processing or running the claim.",
                    },
                },
                {
                    id: "edge_codes_rejected_twice",
                    destination_node_id: "node_end_rejected",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The same code has been rejected or does not work after two attempts.",
                    },
                },
            ],
        },

        "node_wait_for_processing": {
            id: "node_wait_for_processing",
            type: "conversation",
            name: "Wait for Processing",
            skippable: false,
            display_position: { x: 3294, y: 414 },
            instruction: {
                type: "prompt",
                text: `The staff is processing the discount. Wait silently.

Do not speak during the hold.
Do not generate filler.
Pharmacy holds are normal and can last one to five minutes.

When the staff returns with a result, proceed.`,
            },
            edges: [
                {
                    id: "edge_processing_done",
                    destination_node_id: "node_confirm_result",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff has returned with a result — either a new price, no change, a rejection, or confirmation that a discount already exists.",
                    },
                },
            ],
        },

        "node_confirm_result": {
            id: "node_confirm_result",
            type: "conversation",
            name: "Confirm Result",
            skippable: false,
            display_position: { x: 3846, y: 390 },
            instruction: {
                type: "prompt",
                text: `The staff has reported the result. Handle the outcome:

**New price confirmed:**

Say: "Thank you. The new copay of [amount] — is that what you're seeing?"

Confirm and close.

**No change in price:**

Say: "Thank you for checking. I'll note that the price didn't change. Have a good day."

**Coupon rejected:**

Say: "I understand. Can you tell me the rejection reason?"

Note the reason, then say:

"Thank you for checking. I'll follow up on our end. Have a good day."

**Already discounted:**

Say: "Good to know. Thank you for confirming. Have a good day."

Close the conversation after handling the result.`,
            },
            always_edge: {
                id: "edge_result_done",
                destination_node_id: "node_end",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node_end": {
            id: "node_end",
            type: "end",
            name: "End — Normal",
            skippable: false,
            display_position: { x: 4398, y: 486 },
            instruction: {
                type: "prompt",
                text: "End the call after the discount result has been confirmed.",
            },
        },

        "node_end_wrong_pharmacy": {
            id: "node_end_wrong_pharmacy",
            type: "end",
            name: "End — Wrong Pharmacy",
            skippable: false,
            display_position: { x: 1662, y: 78 },
            instruction: {
                type: "prompt",
                text: "Politely end the call because the pharmacy location is incorrect.",
            },
        },

        "node_end_not_found": {
            id: "node_end_not_found",
            type: "end",
            name: "End — Prescription Not Found",
            skippable: false,
            display_position: { x: 2742, y: 1086 },
            instruction: {
                type: "prompt",
                text: "Politely end the call because the pharmacy could not locate the prescription.",
            },
        },

        "node_end_not_ready": {
            id: "node_end_not_ready",
            type: "end",
            name: "End — Prescription Not Ready",
            skippable: false,
            display_position: { x: 2742, y: 1542 },
            instruction: {
                type: "prompt",
                text: "Politely end the call because the prescription is not ready.",
            },
        },

        "node_end_rejected": {
            id: "node_end_rejected",
            type: "end",
            name: "End — Code Rejected",
            skippable: false,
            display_position: { x: 3294, y: 918 },
            instruction: {
                type: "prompt",
                text: "End the call after the discount code has been rejected twice. Do not retry again.",
            },
        },

        "node_end_refused": {
            id: "node_end_refused",
            type: "end",
            name: "End — Staff Refused",
            skippable: false,
            display_position: { x: 462, y: 654 },
            instruction: {
                type: "prompt",
                text: "Politely end the call because the pharmacy staff declined to work with an automated representative.",
            },
        },

        "node_global_automation_question": {
            id: "node_global_automation_question",
            type: "conversation",
            name: "Global — Automation Question",
            skippable: false,
            display_position: { x: 6, y: 486 },
            instruction: {
                type: "prompt",
                text: `The staff asked if you are automated.

Say:

"I'm Alex, an automated representative calling on behalf of {{organization_name}}. I have the discount program details if you're ready."`,
            },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "The pharmacy staff asks if this is an automated call, a robot, or an AI, or asks 'Are you a real person?'",
                },
            },
            edges: [
                {
                    id: "edge_automation_refused",
                    destination_node_id: "node_end_refused",
                    transition_condition: {
                        type: "prompt",
                        prompt: "The staff refuses to work with an automated system or says they will not help.",
                    },
                },
            ],
        },

        "node_global_scope_question": {
            id: "node_global_scope_question",
            type: "conversation",
            name: "Global — Out of Scope",
            skippable: false,
            display_position: { x: 6, y: 966 },
            instruction: {
                type: "prompt",
                text: `The staff asked something outside your scope.

Say:

"I don't have that information. The patient's provider can follow up on that."

Then guide the conversation back to the discount application.`,
            },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "The staff asks about insurance, medication alternatives, dosage, refill requests, or patient medical history — anything outside the discount application.",
                },
            },
            edges: [],
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {} satisfies MainflowSubflowConfig["subflowConfig"],
}