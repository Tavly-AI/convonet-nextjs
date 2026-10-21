import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig, CF } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { CustomFunctionTool, FunctionParameters, GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["reminder-no-show-reducer"]

const edge = (id: string, destination_node_id: string, prompt: string): CF["Edge"] => ({
    id, destination_node_id, transition_condition: { type: "prompt", prompt },
})
const position = (x: number, y: number) => ({ x, y })
const conversation = (
    id: string, name: string, x: number, y: number, text: string,
    edges: CF["Edge"][] = [],
    extra: Record<string, unknown> = {},
) => ({
    id, type: "conversation" as const, name, display_position: position(x, y),
    skippable: false, instruction: { type: "prompt" as const, text }, edges, ...extra,
})
const end = (id: string, name: string, x: number, y: number) => ({
    id, type: "end" as const, name, skippable: false, display_position: position(x, y),
    instruction: { type: "prompt" as const, text: "End the call" },
})
const skip = (id: string, destination: string) => ({
    skippable: true,
    always_edge: edge(id, destination, "Always")
})
const globalSettings = (condition: string, goBackId: string, goBackPrompt: string) => ({
    global_node_setting: {
        condition,
        cool_down: 3,
        go_back_conditions: [{
            id: goBackId,
            transition_condition: { type: "prompt" as const, prompt: goBackPrompt },
        }],
    },
})

// The source has global_node_setting, skip_response_edge and subagent tool_ids.
// Add these optional fields to your CF types as shown below this file.
export const TemplateReminderNoShowReducer = {
    ...template,
    config: {
        ...template.config,
        agentType: "conversational_flow" as const,
        generalTools: [
            {
                type: "custom",
                name: "check_availability",
                description: "Check available appointment slots for a given date. Never invent availability.",
                url: "https://your-api.com/check-availability",
                method: "GET",
                timeout_ms: 10000,
                speak_during_execution: true,
                speak_after_execution: true,
                execution_message_type: "prompt",
                execution_message_description: "Let me check what we have open.",
                response_variables: {
                    available_slots: "data.slots",
                } satisfies NonNullable<CustomFunctionTool["response_variables"]>,
                parameters: {
                    type: "object",
                    properties: {
                        date: { type: "string", description: "Date to check, YYYY-MM-DD." },
                        doctor_name: { type: "string", description: "The patient's doctor." },
                        appointment_type: { type: "string", description: "The appointment type." },
                    } as FunctionParameters["properties"],
                    required: ["date"],
                },
            },
            {
                type: "custom",
                name: "book_appointment",
                description: "Book a new appointment only after explicit patient confirmation.",
                url: "https://your-api.com/book-appointment",
                method: "POST",
                timeout_ms: 15000,
                speak_during_execution: true,
                speak_after_execution: true,
                execution_message_type: "prompt",
                execution_message_description: "I'm booking that for you now.",
                response_variables: {
                    confirmation_number: "data.confirmation_id",
                    booked_date: "data.date",
                    booked_time: "data.time",
                } satisfies NonNullable<CustomFunctionTool["response_variables"]>,
                parameters: {
                    type: "object",
                    properties: {
                        patient_name: { type: "string", description: "Full patient name." },
                        date: { type: "string", description: "New date, YYYY-MM-DD." },
                        time: { type: "string", description: "New time, HH:MM (24-hour)." },
                        doctor_name: { type: "string", description: "Doctor's name." },
                        appointment_type: { type: "string", description: "Appointment type." },
                    } as FunctionParameters["properties"],
                    required: ["patient_name", "date", "time"],
                },
            },
            {
                type: "custom",
                name: "cancel_appointment",
                description: "Cancel an existing appointment only after explicit patient confirmation.",
                url: "https://your-api.com/cancel-appointment",
                method: "POST",
                timeout_ms: 10000,
                speak_during_execution: true,
                speak_after_execution: true,
                execution_message_type: "prompt",
                execution_message_description: "Let me cancel that for you.",
                response_variables: {
                    cancellation_status: "data.status"
                } satisfies NonNullable<CustomFunctionTool["response_variables"]>,
                parameters: {
                    type: "object",
                    properties: {
                        patient_name: { type: "string", description: "Patient name." },
                        appointment_date: { type: "string", description: "Original date, YYYY-MM-DD." },
                        reason: { type: "string", description: "Reason, if provided." },
                        doctor_name: { type: "string", description: "Doctor name." },
                        appointment_time: { type: "string", description: "Original time, HH:MM (24-hour)." },
                    } as FunctionParameters["properties"],
                    required: ["patient_name", "appointment_date"],
                },
            },
            {
                type: "custom",
                name: "send_sms",
                description: "Send a text confirmation with appointment details only after the patient agrees.",
                url: "https://your-api.com/send-confirmation-sms",
                method: "POST",
                timeout_ms: 10000,
                speak_during_execution: true,
                speak_after_execution: true,
                execution_message_type: "prompt",
                execution_message_description: "I'm sending that confirmation to your phone now.",
                parameters: {
                    type: "object",
                    properties: {
                        patient_name: { type: "string", description: "Patient name." },
                        phone_number: { type: "string", description: "Patient phone number." },
                        appointment_date: { type: "string", description: "Appointment date, YYYY-MM-DD." },
                        appointment_time: { type: "string", description: "Appointment time, HH:MM." },
                        doctor_name: { type: "string", description: "Doctor name." },
                        appointment_type: { type: "string", description: "Appointment type." },
                    } as FunctionParameters["properties"],
                    required: ["patient_name", "appointment_date", "appointment_time"],
                },
            },
        ] as GeneralTool[],
    },
    llmConfig: {
        ...template.llmConfig,
        generalPrompt: `## Identity
You are Claire, an automated assistant calling on behalf of {{clinic_name}} to remind patients of upcoming appointments.

Do not handle medical advice, prescription questions, billing, insurance, test results, or clinical information.

## Caller Context
You already know the following. Do not ask the patient to repeat it:
- Patient: {{patient_name}}
- Appointment type: {{appointment_type}}
- Doctor: {{doctor_name}}
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Clinic phone: {{clinic_phone}}
- Address: {{clinic_address}}

## Rules
- Confirm identity before discussing appointment details.
- Never book or cancel without explicit patient consent.
- Verify every tool result before claiming an action succeeded.
- Never invent available slots or claim a callback has been scheduled without a successful backend action.
- Do not discuss diagnoses, treatment details, or medical history.
- If the patient says "hold on" or "one moment", say "Sure, take your time" and wait silently.
- Correct any wrong date, time, or doctor immediately.
- Never retry a failed action more than twice; offer the office callback option.
- With a third party or voicemail, disclose only the minimum necessary information; avoid appointment type, doctor, date and time unless the patient has authorized that disclosure.

## Spoken Output
- Say phone numbers in spoken groups.
- Speak dates in words, not numeric shorthand.
- Speak times naturally ("ten thirty a.m.", "noon").
- Say "Doctor", not "Dr."
- Expand address abbreviations.
- Use "--" for pauses.`,
    },
    mainFlowConfig: {
        "begin-node": {
            id: "begin-node", type: "begin", name: "Begin", skippable: false,
            display_position: position(6, 198),
            edge: edge("begin-edge", "node_greeting", "Always"),
        },
        node_greeting: conversation("node_greeting", "Greeting & Identity", 534, -18,
            'Say exactly: "Hi, this is Claire calling from {{clinic_name}} for {{patient_name}}. Am I speaking with {{patient_name}}?" Wait for the answer.',
            [
                edge("edge_greeting_confirmed", "node_deliver_reminder", "The person confirms they are {{patient_name}}."),
                edge("edge_greeting_someone_else", "node_relay_message", "A family member or caregiver answers and agrees to relay a generic message."),
                edge("edge_greeting_wrong_person", "node_wrong_person_apology", "Wrong number, or patient unavailable and no message can be taken."),
                edge("edge_greeting_voicemail", "node_voicemail", "Voicemail or answering machine detected."),
            ]),
        node_deliver_reminder: conversation("node_deliver_reminder", "Deliver Reminder", 1038, -66,
            'Say: "I’m calling to remind you about your {{appointment_type}} appointment with {{doctor_name}} on {{appointment_date}} at {{appointment_time}}. Will you still be able to make it?" Wait for the answer.',
            [
                edge("edge_reminder_confirmed", "node_offer_sms", "Patient confirms they will attend."),
                edge("edge_reminder_reschedule", "node_reschedule_preference", "Patient wants to reschedule."),
                edge("edge_reminder_cancel", "node_confirm_cancel", "Patient wants to cancel."),
                edge("edge_reminder_uncertain", "node_uncertain", "Patient is uncertain whether they can attend."),
                edge("edge_reminder_already_canceled", "node_already_canceled", "Patient says appointment was already canceled."),
                edge("edge_reminder_confused", "node_explain_appointment", "Patient is confused about the appointment."),
            ]),
        node_explain_appointment: conversation("node_explain_appointment", "Explain Appointment Details", 1662, 3318,
            'Say: "You have a {{appointment_type}} scheduled with {{doctor_name}} on {{appointment_date}} at {{appointment_time}} at {{clinic_address}}. Does that ring a bell? Will you be able to make it?"',
            [
                edge("edge_explain_confirmed", "node_offer_sms", "Patient confirms appointment."),
                edge("edge_explain_reschedule", "node_reschedule_preference", "Patient wants to reschedule."),
                edge("edge_explain_cancel", "node_confirm_cancel", "Patient wants to cancel."),
                edge("edge_explain_still_confused", "node_callback_message", "Patient is still confused or requests human help."),
            ]),
        node_offer_sms: conversation("node_offer_sms", "Offer SMS Confirmation", 2190, 126,
            'Say: "Great, we’ll see you then. Want me to send a text confirmation?" Wait. Only offer once.',
            [
                edge("edge_sms_yes", "node_send_sms", "Patient agrees to text confirmation."),
                edge("edge_sms_no", "node_signoff", "Patient declines SMS or says goodbye."),
            ]),
        node_send_sms: {
            id: "node_send_sms", type: "function", name: "Send SMS Confirmation",
            display_position: position(2742, 198), skippable: false,
            edges: [],
            else_edge: edge("edge_sms_done", "node_signoff", "Else"),
        },
        node_reschedule_preference: conversation("node_reschedule_preference", "Reschedule Preference", 2190, 774,
            'Say: "No problem. Would you like to find a new time now, or would you prefer the office call you back?"',
            [
                edge("edge_reschedule_now", "node_collect_preferred_time", "Patient wants to find a new time now."),
                edge("edge_reschedule_callback", "node_callback_message", "Patient prefers a callback."),
            ]),
        node_collect_preferred_time: {
            id: "node_collect_preferred_time", type: "subagent", name: "Collect Preferred Time",
            display_position: position(2742, 750), skippable: false,
            instruction: { type: "prompt", text: 'Ask: "What date and time work best for you?" Use check_availability to retrieve real slots. Offer two or three returned options; never invent availability. If the check fails twice, offer a callback.' },
            // tool_ids: ["tool_check_availability"],
            edges: [
                edge("edge_slot_selected", "node_confirm_new_time", "Patient chooses an available slot returned by the tool."),
                edge("edge_no_good_slots", "node_callback_message", "No suitable slots or availability failed twice."),
            ],
        },
        node_confirm_new_time: {
            id: "node_confirm_new_time", type: "subagent", name: "Confirm New Time",
            display_position: position(3294, 750), skippable: false,
            instruction: { type: "prompt", text: 'Read back selected date, time, doctor and appointment type. Ask: "Does that work for you?" Only call book_appointment after explicit confirmation. Confirm success only after checking the tool response; on failure, offer a callback.' },
            // tool_ids: ["tool_book_appointment"],
            edges: [
                edge("edge_booking_confirmed", "node_booked", "Patient explicitly confirmed and booking tool succeeded."),
                edge("edge_booking_changed_mind", "node_collect_preferred_time", "Patient wants another time."),
                edge("edge_booking_failed", "node_callback_message", "Booking failed or patient requests callback."),
            ],
        },
        node_confirm_cancel: {
            id: "node_confirm_cancel", type: "subagent", name: "Confirm Cancellation",
            display_position: position(2214, 2286), skippable: false,
            instruction: { type: "prompt", text: 'Say: "I’ll cancel your {{appointment_type}} appointment on {{appointment_date}} at {{appointment_time}}. Are you sure?" Only call cancel_appointment after explicit confirmation. Verify success from tool response; if it fails, offer a callback.' },
            // tool_ids: ["tool_cancel_appointment"],
            edges: [
                edge("edge_cancel_confirmed", "node_canceled", "Patient confirmed and cancellation tool succeeded."),
                edge("edge_cancel_changed_mind", "node_signoff", "Patient chooses to keep appointment."),
                edge("edge_cancel_failed", "node_callback_message", "Cancellation failed twice or patient requests callback."),
            ],
        },
        node_relay_message: conversation("node_relay_message", "Relay Message to Third Party", 1110, 4254,
            'Say: "I’m calling from {{clinic_name}} with a message for {{patient_name}}. Could you ask them to call {{clinic_phone}}?" Do not disclose appointment details to someone whose identity and authorization are unverified.',
            [], { always_edge: edge("edge_relay_done", "node_end_message_relayed", "Always") }),
        node_voicemail: conversation("node_voicemail", "Leave Voicemail", 1086, 5334,
            'Say: "Hi, this is Claire from {{clinic_name}} calling for {{patient_name}}. Please call us back at {{clinic_phone}}. Thank you." Do not disclose appointment details or navigate voicemail menus.',
            [], { always_edge: edge("edge_voicemail_done", "node_end_voicemail", "Always") }),
        node_global_identity: conversation("node_global_identity", "Global — Identity Disclosure", 3294, 1326,
            'Say: "I’m Claire, an automated assistant calling from {{clinic_name}} with an appointment reminder. I can also help reschedule, or I can have the office call you back."',
            [edge("edge_identity_wants_human", "node_callback_message", "Patient insists on a real person.")],
            globalSettings("The patient asks if you are a robot, automated, AI, or a real person.", "edge_identity_go_back", "The question has been answered and the patient is ready to continue.")),
        node_global_out_of_scope: conversation("node_global_out_of_scope", "Global — Out of Scope", 3294, 1830,
            'Say: "I can’t help with that, but the clinic can. Give them a call at {{clinic_phone}}." Then return to the reminder.',
            [edge("edge_scope_wants_human", "node_callback_message", "Patient wants to speak directly to the clinic.")],
            globalSettings("Patient asks about medical advice, prescriptions, billing, insurance, or test results.", "edge_scope_go_back", "The out-of-scope question was addressed and patient is ready to continue.")),
        node_wrong_person_apology: conversation("node_wrong_person_apology", "Apology", 1110, 4830,
            "I'm sorry to bother you. Have a good day.", [], skip("skip_wrong_person", "node_end_wrong_person")),
        node_uncertain: conversation("node_uncertain", "Patient Uncertain", 1710, 2238,
            'Say: "No worries. If anything changes, give us a call at {{clinic_phone}}. We’ll keep you on the schedule for now. Have a good day."',
            [], skip("skip_uncertain", "node_end_uncertain")),
        node_already_canceled: conversation("node_already_canceled", "Already Canceled", 1326, 2574,
            'Say: "I apologize for the mix-up. Please contact the office if you need to verify the cancellation. Have a good day."',
            [], skip("skip_already_canceled", "node_end_already_canceled")),
        node_canceled: conversation("node_canceled", "Appointment Canceled", 2814, 2190,
            'Say: "Your appointment has been canceled. To schedule another, call {{clinic_phone}}. Have a good day."',
            [], skip("skip_canceled", "node_end_canceled")),
        node_signoff: conversation("node_signoff", "Sign Off", 3318, 294,
            "Have a good day!", [], skip("skip_signoff", "node_end_confirmed")),
        node_booked: conversation("node_booked", "Appointment Booked Confirmation", 4182, 966,
            "Your new appointment is booked. Have a good day!", [], skip("skip_booked", "node_end_rescheduled")),
        node_callback_message: conversation("node_callback_message", "Callback Request", 3942, 2622,
            'Say: "Please call the office at {{clinic_phone}} to arrange a callback or a new time. Have a good day." Do not promise a callback has been scheduled without a backend action.',
            [], skip("skip_callback", "node_end_callback")),
        node_end_confirmed: end("node_end_confirmed", "End — Confirmed", 3894, 606),
        node_end_rescheduled: end("node_end_rescheduled", "End — Rescheduled", 4374, 750),
        node_end_canceled: end("node_end_canceled", "End — Canceled", 3222, 2478),
        node_end_uncertain: end("node_end_uncertain", "End — Uncertain", 2070, 2166),
        node_end_already_canceled: end("node_end_already_canceled", "End — Already Canceled", 1662, 2958),
        node_end_wrong_person: end("node_end_wrong_person", "End — Wrong Person", 1614, 4950),
        node_end_callback: end("node_end_callback", "End — Callback Requested", 4566, 2646),
        node_end_message_relayed: end("node_end_message_relayed", "End — Message Relayed", 1542, 4566),
        node_end_voicemail: end("node_end_voicemail", "End — Voicemail Left", 1782, 5550),
    } satisfies MainflowSubflowConfig["mainFlowConfig"],
    subflowConfig: {} satisfies MainflowSubflowConfig["subflowConfig"],
}
