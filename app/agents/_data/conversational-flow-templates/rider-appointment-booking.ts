import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["rider-appointment-booking"]

export const TemplateRiderAppointmentBooking = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...template.config.generalTools as GeneralTool[],

            ({
                type: "end_call",
                name: "end_call",
                description: "Politely end the call after the caller's booking, modification, cancellation, or inquiry has been completed.",
            } satisfies GeneralTool),

            ({
                type: "transfer_call",
                name: "transfer_call",
                description: "Transfer the caller to the dispatch team for complex medical transport needs, insurance authorization issues, complaints, supervisor requests, or unresolved booking problems.",
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
                speak_during_execution: false,
            } satisfies GeneralTool),

            ({
                type: "custom",
                name: "fetch_appointment_details",
                description: "Fetches the existing appointment details for a rider based on their name and date of birth. Call after collecting the caller's identity when they want to view, modify, or cancel an existing appointment.",
                url: "https://template-agents-api.onrender.com/api/fetch-rider-appointment",
                method: "POST",
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                timeout_ms: 120000,
                speak_during_execution: true,
                parameters: {
                    type: "object",
                    properties: {
                        date_of_birth: {
                            type: "string",
                            description: "The rider's date of birth, used to verify identity.",
                        },
                        rider_name: {
                            type: "string",
                            description: "The full name of the rider.",
                        },
                    },
                    required: ["rider_name", "date_of_birth"],
                },
                response_variables: {
                    appointment_date: "appointment_date",
                    appointment_time: "appointment_time",
                    booking_found: "booking_found",
                    booking_id: "booking_id",
                    booking_status: "booking_status",
                    driver_name: "driver_name",
                    dropoff_location: "dropoff_location",
                    insurance_auth_number: "insurance_auth_number",
                    pickup_location: "pickup_location",
                    rider_name: "rider_name",
                    vehicle_type: "vehicle_type",
                },
            } satisfies GeneralTool),

            ({
                type: "custom",
                name: "update_appointment",
                description: "Updates an existing appointment. Can modify pickup location, dropoff location, date, time, or mobility accommodations. Pass only the fields being changed along with booking_id.",
                url: "https://template-agents-api.onrender.com/api/update-rider-appointment",
                method: "POST",
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                timeout_ms: 120000,
                speak_during_execution: true,
                parameters: {
                    type: "object",
                    properties: {
                        booking_id: {
                            type: "string",
                            description: "Booking reference ID.",
                        },
                        new_appointment_date: {
                            type: "string",
                            description: "Updated appointment date.",
                        },
                        new_appointment_time: {
                            type: "string",
                            description: "Updated appointment time.",
                        },
                        new_dropoff_location: {
                            type: "string",
                            description: "Updated destination address.",
                        },
                        new_pickup_location: {
                            type: "string",
                            description: "Updated pickup address.",
                        },
                        new_vehicle_type: {
                            type: "string",
                            description: "Updated mobility accommodation or vehicle type.",
                        },
                    },
                    required: ["booking_id"],
                },
                response_variables: {
                    confirmation_message: "confirmation_message",
                    update_success: "update_success",
                    updated_fields: "updated_fields",
                },
            } satisfies GeneralTool),

            ({
                type: "custom",
                name: "cancel_appointment",
                description: "Cancels an existing rider appointment. Only call after the caller explicitly confirms cancellation.",
                url: "https://template-agents-api.onrender.com/api/cancel-rider-appointment",
                method: "POST",
                args_at_root: true,
                parameter_type: "form",
                headers: {},
                query_params: {},
                timeout_ms: 120000,
                speak_during_execution: true,
                parameters: {
                    type: "object",
                    properties: {
                        booking_id: {
                            type: "string",
                            description: "Booking reference ID.",
                        },
                        cancellation_reason: {
                            type: "string",
                            description: "Optional reason for cancellation.",
                        },
                    },
                    required: ["booking_id"],
                },
                response_variables: {
                    cancellation_confirmation: "cancellation_confirmation",
                    cancellation_success: "cancellation_success",
                    late_fee_applied: "late_fee_applied",
                },
            } satisfies GeneralTool),

            ({
                type: "custom",
                name: "create_booking",
                description: "Creates a new medical transport ride booking after all ride details have been collected and confirmed.",
                url: "https://template-agents-api.onrender.com/api/create-rider-booking",
                method: "POST",
                args_at_root: false,
                parameter_type: "json",
                headers: {},
                query_params: {},
                timeout_ms: 120000,
                speak_during_execution: true,
                parameters: {
                    type: "object",
                    properties: {
                        appointment_date: {
                            type: "string",
                            description: "Requested ride date.",
                        },
                        appointment_time: {
                            type: "string",
                            description: "Requested ride time.",
                        },
                        dropoff_location: {
                            type: "string",
                            description: "Full destination address.",
                        },
                        insurance_auth_number: {
                            type: "string",
                            description: "Insurance authorization number, if applicable.",
                        },
                        pickup_location: {
                            type: "string",
                            description: "Full pickup address.",
                        },
                        rider_name: {
                            type: "string",
                            description: "Full name of the rider.",
                        },
                        vehicle_type: {
                            type: "string",
                            description: "Requested vehicle or mobility accommodation type.",
                        },
                    },
                    required: [
                        "pickup_location",
                        "dropoff_location",
                        "appointment_date",
                        "appointment_time",
                        "vehicle_type",
                        "rider_name",
                    ],
                },
                response_variables: {
                    booking_success: "booking_success",
                    confirmation_number: "confirmation_number",
                    estimated_cost: "estimated_cost",
                    new_appointment_date: "new_appointment_date",
                    new_appointment_time: "new_appointment_time",
                    new_booking_id: "new_booking_id",
                    new_booking_status: "new_booking_status",
                    new_driver_name: "new_driver_name",
                    new_dropoff_location: "new_dropoff_location",
                    new_pickup_location: "new_pickup_location",
                    new_vehicle_type: "new_vehicle_type",
                },
            } satisfies GeneralTool),
        ] satisfies GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,

        generalPrompt: `## Role

You are Maya, a scheduling coordinator for {{transport_service}}. You handle inbound calls to book, modify, or confirm medical transport rides.

## Guidelines

- Keep responses short and conversational.
- Ask one question at a time.
- Coverage area: {{service_area}}.
- 48 hours advance booking preferred.
- 24 hours cancellation notice required, late fees may apply.
- Mobility options: wheelchair, stretcher, ambulatory.

## Hold / Pause Handling

If you are told:
- "Hold on"
- "One moment"
- "Please wait"
- Or similar

You must respond with exactly:

NO_RESPONSE_NEEDED

## Dynamic Variables — Existing Appointments

After fetch_appointment_details is called, the following variables will be available:

- {{rider_name}} — Rider's full name
- {{booking_id}} — Booking reference ID
- {{pickup_location}} — Pickup address
- {{dropoff_location}} — Destination address
- {{appointment_date}} — Scheduled ride date
- {{appointment_time}} — Scheduled ride time
- {{driver_name}} — Assigned driver
- {{vehicle_type}} — Mobility accommodation
- {{booking_status}} — Booking status
- {{insurance_auth_number}} — Insurance authorization number

Use these variables naturally in conversation.

## Dynamic Variables — New Bookings

After create_booking succeeds, the following variables will be available:

- {{new_booking_id}}
- {{confirmation_number}}
- {{new_booking_status}}
- {{estimated_cost}}
- {{new_driver_name}}
- {{new_vehicle_type}}
- {{new_pickup_location}}
- {{new_dropoff_location}}
- {{new_appointment_date}}
- {{new_appointment_time}}

Read these details back clearly to the caller.

## Answer Caller Questions

Match caller questions to the FAQ Knowledge Base.

Provide a natural variation of the matching answer.

After answering, ask:

"Is there anything else I can help you with?"

If the caller has another question, repeat this step.

## Out Of Knowledge Handling

If a question is not covered in the FAQ Knowledge Base, respond exactly:

"That's a great question. This request needs assistance from another department. I can help connect you with the appropriate team. Is there anything else I can help you with before transferring you?"

Do not attempt to answer questions outside the FAQ Knowledge Base.

## FAQ Knowledge Base

### Coverage Area

Q: What areas do you serve?

A: {{service_area}}.

### Advance Booking

Q: How far in advance do I need to book a ride?

A: 48 hours advance notice is preferred.

### Cancellation Policy

Q: What is your cancellation policy?

A: 24 hours notice is required. Late cancellation fees may apply.

### Mobility Options

Q: What mobility accommodations do you offer?

A: Wheelchair, stretcher, and ambulatory options are available.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 6, y: 102 },
            edge: {
                id: "begin-edge",
                destination_node_id: "node-ride-greeting",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node-ride-greeting": {
            id: "node-ride-greeting",
            type: "conversation",
            name: "Greeting",
            skippable: false,
            display_position: { x: 534, y: 30 },
            instruction: {
                type: "static_text",
                text: "Thank you for calling {{transport_service}}. This is Maya with scheduling. Are you calling to book a new ride or about an existing appointment?",
            },
            edges: [
                {
                    id: "edge-ride-greeting-to-intent",
                    destination_node_id: "node-ride-details-component",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants a new booking",
                    },
                },
                {
                    id: "edge-greeting-to-collect-id",
                    destination_node_id: "node-ride-collect-id",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to modify, cancel, or check on an existing appointment",
                    },
                },
                {
                    id: "edge-greeting-else",
                    destination_node_id: "node-ride-escalation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Else",
                    },
                },
            ],
        },

        "node-ride-collect-id": {
            id: "node-ride-collect-id",
            type: "conversation",
            name: "Collect Caller Identity",
            skippable: false,
            display_position: { x: 1110, y: 390 },
            instruction: {
                type: "static_text",
                text: "Sure! Can I get your full name and date of birth so I can pull up your appointment?",
            },
            edges: [
                {
                    id: "edge-collect-id-to-fetch",
                    destination_node_id: "node-ride-fetch-details",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides their name and date of birth",
                    },
                },
            ],
        },

        "node-ride-fetch-details": {
            id: "node-ride-fetch-details",
            type: "function",
            name: "Fetch Appointment Details",
            skippable: false,
            display_position: { x: 1662, y: 390 },
            edges: [
                {
                    id: "edge-fetch-to-existing",
                    destination_node_id: "node-ride-existing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Function call completes and booking_found is true",
                    },
                },
            ],
            else_edge: {
                id: "node-ride-fetch-details-else-edge",
                destination_node_id: "node-ride-not-found",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ride-not-found": {
            id: "node-ride-not-found",
            type: "conversation",
            name: "Appointment Not Found",
            skippable: false,
            display_position: { x: 3846, y: 2550 },
            instruction: {
                type: "static_text",
                text: "I'm sorry, I wasn't able to locate an appointment with that information. Could you double-check your name and date of birth, or would you like to book a new ride instead?",
            },
            edges: [
                {
                    id: "edge-not-found-retry",
                    destination_node_id: "node-ride-collect-id",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to try again with different information",
                    },
                },
                {
                    id: "edge-not-found-new-booking",
                    destination_node_id: "node-ride-details-component",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to book a new ride instead",
                    },
                },
                {
                    id: "edge-not-found-wrap",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to end the call",
                    },
                },
            ],
        },

        "node-ride-existing": {
            id: "node-ride-existing",
            type: "conversation",
            name: "Existing Appointment",
            skippable: false,
            display_position: { x: 2190, y: 294 },
            instruction: {
                type: "prompt",
                text: "Greet the caller by name and confirm the booking on file: Hi {{rider_name}}, I found your appointment. You have a ride scheduled on {{appointment_date}} at {{appointment_time}}, picking up from {{pickup_location}} and heading to {{dropoff_location}}. Your driver is {{driver_name}} and your booking status is {{booking_status}}. What can I help you with today — would you like to modify this appointment, cancel it, or do you have a question about it?",
            },
            edges: [
                {
                    id: "edge-existing-to-update",
                    destination_node_id: "node-ride-collect-update",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to modify or update the appointment",
                    },
                },
                {
                    id: "edge-existing-to-cancel-confirm",
                    destination_node_id: "node-ride-cancel-confirm",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to cancel the appointment",
                    },
                },
                {
                    id: "edge-existing-done",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller has no changes and is satisfied",
                    },
                },
            ],
        },

        "node-ride-collect-update": {
            id: "node-ride-collect-update",
            type: "conversation",
            name: "Collect Update Details",
            skippable: false,
            display_position: { x: 4398, y: 366 },
            instruction: {
                type: "prompt",
                text: "Ask the caller what they would like to change on booking {{booking_id}}: What would you like to update? For example, I can change the pickup address, destination, date, time, or mobility accommodations. What needs to change?",
            },
            edges: [
                {
                    id: "edge-collect-update-to-fn",
                    destination_node_id: "node-ride-update-appointment",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides the new details they want updated",
                    },
                },
            ],
        },

        "node-ride-update-appointment": {
            id: "node-ride-update-appointment",
            type: "function",
            name: "Update Appointment",
            skippable: false,
            display_position: { x: 4950, y: 390 },
            edges: [
                {
                    id: "edge-update-success",
                    destination_node_id: "node-ride-update-confirm",
                    transition_condition: {
                        type: "prompt",
                        prompt: "update_success is true",
                    },
                },
            ],
            else_edge: {
                id: "node-ride-update-appointment-else-edge",
                destination_node_id: "node-ride-update-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ride-update-confirm": {
            id: "node-ride-update-confirm",
            type: "conversation",
            name: "Update Confirmed",
            skippable: false,
            display_position: { x: 7158, y: 366 },
            instruction: {
                type: "prompt",
                text: "Confirm the update to the caller: Your appointment has been updated successfully. Your booking reference is {{booking_id}}. You will receive a confirmation of the changes shortly. Is there anything else I can help you with?",
            },
            edges: [
                {
                    id: "edge-update-confirm-done",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller has no further needs",
                    },
                },
            ],
        },

        "node-ride-update-failed": {
            id: "node-ride-update-failed",
            type: "conversation",
            name: "Update Failed",
            skippable: false,
            display_position: { x: 5502, y: 630 },
            instruction: {
                type: "static_text",
                text: "I apologize, I was unable to update your appointment at this time. Let me connect you with our dispatch team who can assist you directly.",
            },
            edges: [
                {
                    id: "edge-update-fail-escalate",
                    destination_node_id: "node-ride-escalation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller agrees to be transferred or needs further help",
                    },
                },
                {
                    id: "edge-update-fail-wrap",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller declines transfer and wants to end the call",
                    },
                },
            ],
        },

        "node-ride-cancel-confirm": {
            id: "node-ride-cancel-confirm",
            type: "conversation",
            name: "Confirm Cancellation Intent",
            skippable: false,
            display_position: { x: 2742, y: 1062 },
            instruction: {
                type: "prompt",
                text: "Confirm the cancellation request before proceeding: Just to confirm, you'd like to cancel your ride on {{appointment_date}} at {{appointment_time}} from {{pickup_location}} to {{dropoff_location}}. Booking ID {{booking_id}}. Please note that cancellations with less than 24 hours notice may incur a late fee. Are you sure you want to cancel?",
            },
            edges: [
                {
                    id: "edge-cancel-confirmed",
                    destination_node_id: "node-ride-cancel-appointment",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms they want to cancel",
                    },
                },
                {
                    id: "edge-cancel-declined",
                    destination_node_id: "node-ride-existing",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller changes their mind and does not want to cancel",
                    },
                },
            ],
        },

        "node-ride-cancel-appointment": {
            id: "node-ride-cancel-appointment",
            type: "function",
            name: "Cancel Appointment",
            skippable: false,
            display_position: { x: 3294, y: 1110 },
            edges: [
                {
                    id: "edge-cancel-success",
                    destination_node_id: "node-ride-cancel-done",
                    transition_condition: {
                        type: "prompt",
                        prompt: "cancellation_success is true",
                    },
                },
            ],
            else_edge: {
                id: "node-ride-cancel-appointment-else-edge",
                destination_node_id: "node-ride-cancel-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ride-cancel-done": {
            id: "node-ride-cancel-done",
            type: "conversation",
            name: "Cancellation Confirmed",
            skippable: false,
            display_position: { x: 3846, y: 1398 },
            instruction: {
                type: "prompt",
                text: "Confirm the cancellation: Your appointment has been successfully cancelled. You will receive a cancellation confirmation shortly. If you need to rebook in the future, please call us at least 48 hours in advance. Is there anything else I can help you with?",
            },
            edges: [
                {
                    id: "edge-cancel-done-wrap",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller has no further needs",
                    },
                },
                {
                    id: "edge-1773764510437-h6ya3osxz",
                    destination_node_id: "node-ride-details-component",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller wants to book an appointment",
                    },
                },
                {
                    id: "edge-1773764523472-ou23xxi0c",
                    destination_node_id: "node-ride-collect-id",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller has a request about another appointment",
                    },
                },
            ],
        },

        "node-ride-cancel-failed": {
            id: "node-ride-cancel-failed",
            type: "conversation",
            name: "Cancellation Failed",
            skippable: false,
            display_position: { x: 5430, y: 1182 },
            instruction: {
                type: "static_text",
                text: "I'm sorry, I was unable to process the cancellation at this time. Let me connect you with our dispatch team to assist you.",
            },
            edges: [
                {
                    id: "edge-cancel-fail-escalate",
                    destination_node_id: "node-ride-escalation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller agrees to be transferred",
                    },
                },
                {
                    id: "edge-cancel-fail-wrap",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller declines transfer and wants to end the call",
                    },
                },
            ],
        },

        "node-ride-details-component": {
            id: "node-ride-details-component",
            type: "subflow",
            name: "Ride Details Collection",
            skippable: false,
            display_position: { x: 4398, y: 1950 },
            conversation_flow_component_id: "local-comp-ride-details",
            edges: [],
            else_edge: {
                id: "node-ride-details-component-else",
                destination_node_id: "function-1773764044807-0",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-ride-escalation": {
            id: "node-ride-escalation",
            type: "conversation",
            name: "Escalation",
            skippable: false,
            display_position: { x: 6054, y: 1254 },
            global_node_setting: {
                condition: {
                    type: "prompt",
                    prompt: "Caller has complex medical transport needs, insurance authorization issues, complaints, or requests a supervisor",
                },
            },
            instruction: {
                type: "prompt",
                text: "Acknowledge the caller's concern and let them know they will be transferred to a human representative.",
            },
            edges: [],
            always_edge: {
                id: "skip-ride-escalation",
                destination_node_id: "node-ride-transfer",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-ride-transfer": {
            id: "node-ride-transfer",
            type: "transfer_call",
            name: "Transfer Call",
            skippable: false,
            display_position: { x: 6534, y: 1206 },
            speak_during_execution: false,
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
            edge: {
                id: "edge-ride-transfer-failed",
                destination_node_id: "node-ride-transfer-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "node-ride-transfer-failed": {
            id: "node-ride-transfer-failed",
            type: "conversation",
            name: "Transfer Failed",
            skippable: false,
            display_position: { x: 7158, y: 1158 },
            instruction: {
                type: "prompt",
                text: "I apologize, the team is not available. Can I take your name and phone number for a callback?",
            },
            edges: [
                {
                    id: "edge-ride-failed-done",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides info or declines",
                    },
                },
            ],
        },

        "node-ride-wrap-up": {
            id: "node-ride-wrap-up",
            type: "conversation",
            name: "Wrap Up",
            skippable: false,
            display_position: { x: 7710, y: 1494 },
            instruction: {
                type: "prompt",
                text: "Thank you for calling {{transport_service}}. If you need anything else, please do not hesitate to call back. Have a great day.",
            },
            edges: [],
            always_edge: {
                id: "skip-ride-wrap",
                destination_node_id: "node-ride-end",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-ride-end": {
            id: "node-ride-end",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 8262, y: 1494 },
            instruction: {
                type: "prompt",
                text: "End the call.",
            },
        },

        "function-1773764044807-0": {
            id: "function-1773764044807-0",
            type: "function",
            name: "Create Booking",
            skippable: false,
            display_position: { x: 4950, y: 1782 },
            edges: [
                {
                    id: "function-1773764044807-0-edges-1773764044807-0",
                    destination_node_id: "conversation-1773764044807-1",
                    transition_condition: {
                        type: "prompt",
                        prompt: "booking_success is true",
                    },
                },
            ],
            else_edge: {
                id: "function-1773764044807-0-else-edge",
                destination_node_id: "conversation-1773764044807-2",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "conversation-1773764044807-1": {
            id: "conversation-1773764044807-1",
            type: "conversation",
            name: "Booking Confirmed",
            skippable: false,
            display_position: { x: 7158, y: 1710 },
            instruction: {
                type: "prompt",
                text: "Read back the confirmed booking details to the caller: Great news! Your ride has been successfully booked. Here are your details: Booking ID {{new_booking_id}}, Confirmation Number {{confirmation_number}}. Your {{new_vehicle_type}} will pick you up at {{new_pickup_location}} on {{new_appointment_date}} at {{new_appointment_time}} and take you to {{new_dropoff_location}}. Your driver will be {{new_driver_name}} and the estimated cost is {{estimated_cost}}. Your booking status is {{new_booking_status}}. You will receive a confirmation shortly. Is there anything else I can help you with?",
            },
            edges: [
                {
                    id: "conversation-1773764044807-1-edge-1773764044807-0",
                    destination_node_id: "node-ride-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller acknowledges the confirmation",
                    },
                },
            ],
        },

        "conversation-1773764044807-2": {
            id: "conversation-1773764044807-2",
            type: "conversation",
            name: "Booking Failed",
            skippable: false,
            display_position: { x: 5502, y: 2022 },
            instruction: {
                type: "static_text",
                text: "I'm sorry, I wasn't able to complete the booking at this time. Our system may be temporarily unavailable. Please call us back or I can transfer you to our dispatch team for assistance. Would you like me to transfer you now?",
            },
            edges: [
                {
                    id: "conversation-1773764044807-2-edge-1773764044807-0",
                    destination_node_id: "node-ride-escalation",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller agrees to be transferred",
                    },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {
        "local-comp-ride-details": {
            conversation_flow_component_id: "local-comp-ride-details",
            name: "Ride Details Collection",
            flex_mode: true,

            nodes: [
                {
                    id: "comp-ride-start",
                    type: "subflow_start",
                    name: "Start",
                    skippable: false,
                    display_position: { x: 1638, y: 54 },
                    edge: {
                        id: "comp-ride-start-edge",
                        destination_node_id: "comp-ride-collect-pickup",
                        transition_condition: {
                            type: "prompt",
                            prompt: "Start",
                        },
                    },
                },

                {
                    id: "comp-ride-collect-pickup",
                    type: "conversation",
                    name: "Collect Pickup Address",
                    skippable: false,
                    display_position: { x: 2190, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Ask: What is the pickup address?",
                    },
                    edges: [
                        {
                            id: "edge-ride-pickup-done",
                            destination_node_id: "comp-ride-collect-dest",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller provides pickup address",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-collect-dest",
                    type: "conversation",
                    name: "Collect Destination",
                    skippable: false,
                    display_position: { x: 2742, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Ask: And what is the destination address?",
                    },
                    edges: [
                        {
                            id: "edge-ride-dest-done",
                            destination_node_id: "comp-ride-collect-datetime",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller provides destination address",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-collect-datetime",
                    type: "conversation",
                    name: "Collect Date and Time",
                    skippable: false,
                    display_position: { x: 3294, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Ask: What date and time do you need the ride?",
                    },
                    edges: [
                        {
                            id: "edge-ride-datetime-done",
                            destination_node_id: "comp-ride-collect-mobility",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller provides date and time",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-collect-mobility",
                    type: "conversation",
                    name: "Collect Mobility Needs",
                    skippable: false,
                    display_position: { x: 3846, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Ask: Do you need any mobility accommodations such as a wheelchair, stretcher, or are you ambulatory?",
                    },
                    edges: [
                        {
                            id: "edge-ride-mobility-done",
                            destination_node_id: "comp-ride-collect-insurance",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller specifies mobility needs",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-collect-insurance",
                    type: "conversation",
                    name: "Collect Insurance Auth",
                    skippable: false,
                    display_position: { x: 4398, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Ask: Do you have an insurance authorization number for this trip?",
                    },
                    edges: [
                        {
                            id: "edge-ride-insurance-done",
                            destination_node_id: "comp-ride-confirm",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller provides insurance info or indicates none",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-confirm",
                    type: "conversation",
                    name: "Confirm Details",
                    skippable: false,
                    display_position: { x: 4950, y: 54 },
                    instruction: {
                        type: "prompt",
                        text: "Summarize all collected details: pickup address, destination, date and time, mobility accommodations, and insurance authorization. Ask the caller to confirm accuracy.",
                    },
                    edges: [
                        {
                            id: "edge-ride-confirm-ok",
                            destination_node_id: "comp-ride-exit",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller confirms all details are correct",
                            },
                        },
                        {
                            id: "edge-ride-confirm-fix",
                            destination_node_id: "comp-ride-collect-pickup",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller wants to correct information",
                            },
                        },
                    ],
                },

                {
                    id: "comp-ride-exit",
                    type: "subflow_end",
                    name: "Exit Component",
                    skippable: false,
                    display_position: { x: 6606, y: 54 },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["subflowConfig"],
}