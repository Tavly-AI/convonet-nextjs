import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["event-webinar-reminder"]

const edge = (id: string, destination_node_id: string, prompt: string) => ({
    id,
    destination_node_id,
    transition_condition: { type: "prompt" as const, prompt },
})

export const TemplateEventWebinarReminder = {
    ...template,
    config: {
        ...template.config,
        agentType: "conversational_flow" as const,
        generalTools: [
            ...(template.config.generalTools as GeneralTool[]),
            {
                type: "custom",
                name: "confirm_attendant",
                description: "Confirm the caller's attendance using their existing registration. Call only after they confirm they will attend.",
                url: "https://template-agents-api.onrender.com/api/confirm_event_attendant",
                method: "POST",
                timeout_ms: 10000,
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                response_variables: {},
                speak_during_execution: true,
                execution_message_type: "static_text",
                execution_message_description: "Let me confirm your attendance.",
                parameters: {
                    type: "object",
                    properties: {
                        attendant_number: {
                            type: "string",
                            description: "The attendee's registered phone number: {{user_number}}",
                        },
                    },
                    required: ["attendant_number"],
                },
            },
            {
                type: "custom",
                name: "unregister_attendant",
                description: "Cancel the caller's event registration only after they explicitly confirm cancellation.",
                url: "https://template-agents-api.onrender.com/api/unregister_event_attendant",
                method: "POST",
                timeout_ms: 10000,
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                response_variables: {},
                speak_during_execution: true,
                execution_message_type: "static_text",
                execution_message_description: "Let me cancel your registration.",
                parameters: {
                    type: "object",
                    properties: {
                        attendant_number: {
                            type: "string",
                            description: "The attendee's registered phone number: {{user_number}}",
                        },
                    },
                    required: ["attendant_number"],
                },
            },
            {
                type: "custom",
                name: "change_registration",
                description: "Move the caller's registration to another event or session only after they request and confirm the change.",
                url: "https://template-agents-api.onrender.com/api/change_event_registration",
                method: "POST",
                timeout_ms: 10000,
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                response_variables: {},
                speak_during_execution: true,
                execution_message_type: "static_text",
                execution_message_description: "Let me update your registration.",
                parameters: {
                    type: "object",
                    properties: {
                        attendant_number: {
                            type: "string",
                            description: "The attendee's registered phone number: {{user_number}}",
                        },
                        next_event_id: {
                            type: "string",
                            description: "The event ID of the next session: {{next_event_id}}",
                        },
                    },
                    required: ["attendant_number", "next_event_id"],
                },
            },
            {
                type: "transfer_call",
                name: "transfer_call",
                description: "Transfer the caller for technical joining issues, speaker or sponsorship inquiries, refunds, requests for a human representative, or questions outside the FAQ.",
                transfer_destination: {
                    type: "predefined",
                    number: "{{transfer_number}}",
                },
                transfer_option: {
                    type: "cold_transfer",
                    cold_transfer_mode: "sip_invite",
                    show_transferee_as_caller: true,
                },
                custom_sip_headers: {},
                ignore_e164_validation: false,
                speak_during_execution: true,
                execution_message_type: "static_text",
                execution_message_description: "One moment while I transfer you.",
            },
        ] satisfies GeneralTool[],
    },
    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Role
You are Riley, an event coordinator for {{company}}. You make outbound reminder calls to registered attendees for {{event_name}}.

## Guidelines
- Keep responses short and conversational.
- Event details: {{date}} at {{time}} {{timezone}}.
- Next session: {{next_date}}.
- Access link will be emailed before the event.

## Hold / Pause Handling
If told "Hold on", "One moment", "Please wait", or similar, respond exactly:
NO_RESPONSE_NEEDED

## Answer Registrant Questions
Match the question to the FAQ below. Give a natural, conversational variation of the answer rather than reading verbatim. Wait for the caller's response, then ask whether they need anything else. Repeat for additional questions.

## Out Of Knowledge Handling
For questions not covered in the FAQ, say exactly:
"That's a great question. This request needs assistance from another department. I can help connect you with the appropriate team. Is there anything else I can help you with before transferring you?"
Wait for the response. Do not answer questions outside the FAQ.

## FAQ Knowledge Base
### Event Date and Time
Q: When is the event?
A: {{date}} at {{time}} {{timezone}}.

### How to Join
Q: How do I join the event?
A: An access link will be emailed before the event.

### Recording
Q: Will there be a recording?
A: Yes, it will be sent within 48 hours after the event.

### Switching Sessions
Q: Can I switch to a different session?
A: Yes, I can move your registration to the next available session.`,
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
                destination_node_id: "node-event-greeting",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },
        "node-event-greeting": {
            id: "node-event-greeting", type: "conversation", name: "Greeting", display_position: { x: 558, y: 54 }, skippable: false,
            instruction: { type: "static_text", text: "Hi, this is Riley from {{company}}. I am calling with a quick reminder about the {{event_name}} coming up on {{date}}. Do you have a moment?" },
            edges: [edge("edge-greeting-to-attendance", "node-event-attendance-check", "Caller responds or confirms they have a moment")],
        },
        "node-event-attendance-check": {
            id: "node-event-attendance-check", type: "conversation", name: "Attendance Check", display_position: { x: 1086, y: 6 }, skippable: false,
            instruction: { type: "prompt", text: "Check if the customer is still planning to attend the event." },
            edges: [
                edge("edge-attendance-to-not-attending", "node-event-alternatives", "Registrant is not attending"),
                edge("edge-attendance-to-attending", "node-confirm-attendant-call", "Registrant is attending"),
            ],
        },
        "node-confirm-attendant-call": {
            id: "node-confirm-attendant-call", type: "function", name: "Confirm Attendant", display_position: { x: 1662, y: 1422 }, skippable: false,
            edges: [edge("edge-confirm-attendant-success", "node-event-logistics", "Function call succeeded")],
            else_edge: edge("node-confirm-attendant-call-else-edge", "node-confirm-attendant-failed", "Else"),
        },
        "node-confirm-attendant-failed": {
            id: "node-confirm-attendant-failed", type: "conversation", name: "Confirm Attendant Failed", display_position: { x: 2190, y: 1710 }, skippable: false,
            instruction: { type: "static_text", text: "I was unable to confirm your attendance in our system right now, but your registration is still active. Let me share the event details with you." },
            edges: [edge("edge-confirm-failed-to-logistics", "node-event-logistics", "Caller acknowledges or wants to proceed")],
        },
        "node-event-logistics": {
            id: "node-event-logistics", type: "conversation", name: "Share Logistics", display_position: { x: 2742, y: 1374 }, skippable: false,
            instruction: { type: "prompt", text: "Let the customer know their attendance has been successfully confirmed. Quick recap: The event is on {{date}} at {{time}} {{timezone}}. Let them know their access link will be emailed before the event. Ask them if they have any other questions." },
            edges: [edge("edge-event-logistics-done", "node-event-end", "Registrant has no further questions")],
        },
        "node-event-alternatives": {
            id: "node-event-alternatives", type: "conversation", name: "Offer Alternatives", display_position: { x: 1662, y: 6 }, skippable: false,
            instruction: { type: "static_text", text: "We have another session on {{next_date}}. Would you like me to move your registration to that one?" },
            edges: [
                edge("edge-alt-to-change-reg", "node-change-registration-call", "Registrant wants to move to the next session or change their registration to a different event"),
                edge("edge-alt-to-unregister", "node-confirm-unregister", "Registrant refuses alternate event"),
            ],
        },
        "node-confirm-unregister": {
            id: "node-confirm-unregister", type: "conversation", name: "Confirm Unregister Intent", display_position: { x: 2190, y: 6 }, skippable: false,
            instruction: { type: "static_text", text: "Just to confirm, you would like to cancel your registration for {{event_name}} on {{date}}. Is that correct?" },
            edges: [
                edge("edge-confirm-unregister-yes", "node-unregister-attendant-call", "Caller confirms they want to cancel"),
                edge("edge-confirm-unregister-no", "node-event-alternatives", "Caller changes their mind and does not want to cancel"),
            ],
        },
        "node-unregister-attendant-call": {
            id: "node-unregister-attendant-call", type: "function", name: "Unregister Attendant", display_position: { x: 2742, y: 30 }, skippable: false,
            edges: [edge("edge-unregister-success", "node-unregister-success", "Function call succeeded")],
            else_edge: edge("node-unregister-attendant-call-else-edge", "node-unregister-failed", "Else"),
        },
        "node-unregister-success": {
            id: "node-unregister-success", type: "conversation", name: "Unregister Success", display_position: { x: 3294, y: 6 }, skippable: false,
            instruction: { type: "static_text", text: "Your registration has been cancelled. We are sorry you will not be able to make it. If you change your mind or would like to join a future event, you are always welcome to re-register." },
            edges: [], always_edge: edge("always-edge-1775601369024-5215275sw", "node-event-end", "Always"),
        },
        "node-unregister-failed": {
            id: "node-unregister-failed", type: "conversation", name: "Unregister Failed", display_position: { x: 3294, y: 510 }, skippable: false,
            instruction: { type: "static_text", text: "I am sorry, I was unable to cancel your registration at this time. Please reply to your confirmation email or visit our website to complete the cancellation. I apologize for the inconvenience." },
            edges: [edge("edge-unregister-failed-to-wrap", "node-event-end", "Caller acknowledges or wants to end the call")],
        },
        "node-change-registration-call": {
            id: "node-change-registration-call", type: "function", name: "Change Registration", display_position: { x: 2190, y: 2070 }, skippable: false,
            edges: [edge("edge-change-reg-success", "node-change-registration-success", "Function call succeeded")],
            else_edge: edge("node-change-registration-call-else-edge", "node-change-registration-failed", "Else"),
        },
        "node-change-registration-success": {
            id: "node-change-registration-success", type: "conversation", name: "Change Registration Success", display_position: { x: 2742, y: 2046 }, skippable: false,
            instruction: { type: "prompt", text: "Let the customer know that registration has been successfully moved to the new session, and they will receive an updated confirmation email shortly. Ask if there's anything else you can help with." },
            edges: [edge("edge-change-success-to-wrap", "node-event-end", "Caller has no further questions")],
        },
        "node-change-registration-failed": {
            id: "node-change-registration-failed", type: "conversation", name: "Change Registration Failed", display_position: { x: 2742, y: 2526 }, skippable: false,
            instruction: { type: "static_text", text: "I am sorry, I was unable to update your registration at this time. Please visit our website or reply to your confirmation email to make the change manually. I apologize for the inconvenience." },
            edges: [], always_edge: edge("always-edge-1775601724104-ubrxqxlhs", "node-event-end", "Always"),
        },
        // global node
        "node-event-escalation": {
            id: "node-event-escalation", type: "conversation", name: "Escalation", display_position: { x: 2214, y: 774 }, skippable: false,
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "Registrant has technical issues joining, speaker or sponsorship inquiries, or refund requests",
                },
            },
            instruction: { type: "static_text", text: "Let me connect you with the appropriate team to help with that." },
            edges: [edge("skip-event-escalation", "node-event-transfer", "Registrant has technical issues joining, speaker or sponsorship inquiries, or refund requests")],
        },
        "node-event-transfer": {
            id: "node-event-transfer", type: "transfer_call", name: "Transfer Call", display_position: { x: 2742, y: 1014 }, skippable: false,
            speak_during_execution: false,
            transfer_destination: { type: "predefined", number: "{{transfer_number}}" },
            transfer_option: { type: "cold_transfer", cold_transfer_mode: "sip_invite", show_transferee_as_caller: true },
            edge: edge("edge-event-transfer-failed", "node-event-transfer-failed", "Transfer failed"),
            custom_sip_headers: {}, ignore_e164_validation: false,
        },
        "node-event-transfer-failed": {
            id: "node-event-transfer-failed", type: "conversation", name: "Transfer Failed", display_position: { x: 3294, y: 990 }, skippable: false,
            instruction: { type: "static_text", text: "I apologize, the team is not available right now. Can I take your contact info for a callback?" },
            edges: [edge("edge-event-failed-done", "node-1775602836826", "Customer confirms echo verification of contact info")],
        },
        "node-event-end": {
            id: "node-event-end", type: "end", name: "End Call", display_position: { x: 3846, y: 1710 }, skippable: false,
            instruction: { type: "prompt", text: "End call gracefully" },
        },
        "node-1775602836826": {
            id: "node-1775602836826", type: "conversation", name: "Conversation", display_position: { x: 3366, y: 1374 }, skippable: false,
            instruction: { type: "prompt", text: "Let the customer know that they are confirmed for the callback." },
            edges: [], always_edge: edge("skip-response-edge-1775602866292-ot6vtsovo", "node-event-end", "Always"),
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],
    subflowConfig: {} satisfies MainflowSubflowConfig["subflowConfig"],
}
