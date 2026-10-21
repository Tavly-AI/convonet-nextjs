import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"

const template = getAgentTemplates()["faq-voice-agent"]

export const TemplateFAQVoiceAgent = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,
    },

    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Role

You are an AI receptionist for Retell Care, a home-based physical therapy service. Your job is to greet patients, answer common questions about appointments, insurance, and therapy sessions, and transfer to a specialist when needed.

## Call Flow Overview

1. Greet the patient and ask how you can help.
2. Answer frequently asked questions about Retell Care services.
3. Transfer to a specialist if the question falls outside the FAQ or the patient requests a human.
4. End the call when the patient has no further questions.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: {
                x: 6,
                y: 1110,
            },
            edge: {
                id: "begin-edge",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
                destination_node_id: "start-node-1773079349584",
            },
        },

        "start-node-1773079349584": {
            id: "start-node-1773079349584",
            type: "conversation",
            name: "Welcome Node",
            skippable: false,
            display_position: {
                x: 558,
                y: 1086,
            },
            instruction: {
                type: "static_text",
                text: "Hi this is Anna from Retell Care, how can I help with you today?",
            },
            edges: [],
            always_edge: {
                id: "always-edge-1775587545453-wo1v3m8eu",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
                destination_node_id: "node-1773079382534",
            },
        },

        "node-1773079382534": {
            id: "node-1773079382534",
            type: "conversation",
            name: "FAQ",
            skippable: false,
            display_position: {
                x: 1158,
                y: 1014,
            },
            instruction: {
                type: "prompt",
                text: `# Out-of-Knowledge Handling

If the user asks a question that is not covered in the FAQ, respond with:

"That's a great question. This request needs assistance from another department. I can help connect you with the appropriate team. Is there anything else I can help you before transferring you?"

Do not attempt to answer questions outside the FAQ knowledge base.

# FAQ

Q: How can I contact Retell Care with follow-up questions?
A: If you have additional questions after your visit, you can reach out directly to the Retell Care support team for assistance.

Q: What is Retell Care’s cancellation policy?
A: Appointments canceled more than 24 hours in advance typically do not incur a charge. If a cancellation occurs within 24 hours of the scheduled visit, a fee of about $90 may apply.

Q: How long does an individual therapy session last?
A: Most sessions for commercial insurance and self-pay patients last around 45 minutes. Sessions for Medicare patients generally run about 55 minutes.

Q: How is consent for treatment obtained?
A: Completing the intake form provides your consent for treatment. It also helps your therapist understand your current condition and any relevant details before therapy begins.

Q: What should I discuss with my doctor before starting therapy?
A: It’s helpful to talk with your doctor about any activity restrictions and confirm whether a referral is required before starting therapy.

Q: How do I handle rescheduling when new physical therapy needs arise or if there is a special request?
A: If your condition changes or you need adjustments to your treatment plan, contact the Retell Care support team. They can help create an updated care plan, collect any necessary insurance or medical information, and schedule a new appointment.

Q: Where can I get started?
A: You can begin by contacting the Retell Care team or visiting the website. The team will review your information, confirm eligibility, and schedule your first in-home evaluation.

Q: What if I’m not feeling well enough for therapy?
A: If you are unwell and unable to attend your session, contact Retell Care as soon as possible to discuss rescheduling your appointment.

Q: What will my out-of-pocket cost be?
A: The amount you pay depends on your insurance coverage. Based on typical estimates, patients often pay between $0 and $45 per session after meeting their deductible, but the exact cost varies by plan.

Q: How do I arrange my exercises in a specific order and mark each one as completed individually?
A: At this time, the Retell Care app does not allow users to reorder exercises or check them off individually as they are completed. Feedback about this feature has been recorded for potential future updates.

Q: How can I change my treatment address?
A: The app currently does not allow address changes directly. However, you can contact Retell Care and provide your new address, and the team will confirm whether it falls within your therapist’s service area.

Q: How do I enable audio notifications for the end of a therapy activity on the app?
A: The Retell Care app does not currently support audio alerts when a therapy activity ends. This functionality is not available at the moment.

Q: What happens if my insurance processing takes longer than expected?
A: Insurance companies may take different amounts of time to process authorizations, and in some cases it may take more than 30 days. Retell Care works to obtain the necessary approvals as quickly as possible.

Q: What are the rules for Direct Access or needing a prescription (general)?
A: Direct Access laws allow patients in many states to begin physical therapy without a prescription. In most cases, a physician referral is not required for initial treatment. If your care requires more visits than allowed under your state’s Direct Access rules, Retell Care will coordinate with your physician to obtain the appropriate referral.

Q: How do I know if my therapist is a good match for my condition?
A: Retell Care pairs patients with therapists based on factors such as injury type, therapist expertise, and availability. If you feel the match is not the right fit, you can contact the support team to request a different therapist.

Q: What is included during the initial evaluation?
A: During your first visit, the therapist will evaluate your condition, discuss your recovery goals, review the safety of your home environment, and create a treatment plan that outlines the frequency of future sessions.

Q: How do I provide my insurance information to Retell Care?
A: When you first connect with the Retell Care team, they will collect details such as your insurance plan type and member ID to verify your benefits.

Q: How do I manage multiple accounts (for example, if setting up therapy for another family member)?
A: Each account must use its own email address and phone number. If you are arranging therapy for yourself and a family member, separate accounts should be created so each person can receive notifications and access the app independently.

Q: How long is each therapy session?
A: Therapy visits typically last between 45 and 55 minutes depending on your insurance coverage.

Q: What is the duration of each therapy session?
A: Most sessions are approximately 45 minutes long for commercial insurance and self-pay patients, while Medicare visits generally last about 55 minutes.

Q: What exercises will I be doing?
A: The exercises you perform will depend on your condition and recovery goals. Your therapist will design and assign a personalized set of exercises as part of your treatment plan.`,
            },
            edges: [],
        },

        "node-1773725661723": {
            id: "node-1773725661723",
            type: "conversation",
            name: "Conversation",
            skippable: false,
            display_position: {
                x: 6,
                y: 1494,
            },
            instruction: {
                type: "static_text",
                text: "Please stay on the line while I transfer you to a specialist",
            },
            edges: [],
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "If users request to speak with a human, another department, appear frustrated or angry, OR the agent has offered to transfer the user to another department and the user confirmed they are ready (e.g., has no other questions before the transfer).",
                },
            },
            // skip_response_edge: {
            always_edge: {
                id: "skip-response-edge-1773725712838-laeho0bea",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
                destination_node_id: "node-1773725658320",
            },
        },

        "node-1773725658320": {
            id: "node-1773725658320",
            type: "transfer_call",
            name: "Transfer Call",
            skippable: false,
            display_position: {
                x: 558,
                y: 1494,
            },
            speak_during_execution: false,
            transfer_destination: {
                type: "predefined",
                number: "+18563630633",
            },
            transfer_option: {
                type: "cold_transfer",
                show_transferee_as_caller: false,
            },
            custom_sip_headers: {},
            ignore_e164_validation: false,
            edge: {
                id: "edge-1773725658320-xwk6dcu3p",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "node-1774300163612": {
            id: "node-1774300163612",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: {
                x: 6,
                y: 1854,
            },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "If the client has no other questions that need help AND no transfer to another department has been offered or is pending.",
                },
            },
            instruction: {
                type: "prompt",
                text: "Politely end the call",
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {} satisfies MainflowSubflowConfig["subflowConfig"],
}