import { getAgentTemplates } from "../templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"
import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"

const template = getAgentTemplates()["b2b-demo-qualification"]

export const TemplateB2BDemoQualification = {
    ...template,

    config: {
        ...template.config,
        agentType: "conversational_flow" as const,

        generalTools: [
            ...(template.config.generalTools as GeneralTool[]),

            ({
                type: "end_call",
                name: "end_call",
                description: "Politely end the call when the conversation is complete.",
            } satisfies GeneralTool),

            ({
                type: "transfer_call",
                name: "transfer_to_account_executive",
                description: "Transfer a qualified prospect to an Account Executive for a personalized product demo.",
                transfer_destination: {
                    type: "predefined",
                    number: "{{transfer_number}}",
                },
                transfer_option: {
                    type: "cold_transfer",
                    cold_transfer_mode: "sip_invite",
                    show_transferee_as_caller: true,
                },
                ignore_e164_validation: false,
                speak_during_execution: false,
            } satisfies GeneralTool),

            ({
                type: "transfer_call",
                name: "transfer_to_support",
                description: "Transfer an existing customer to the support team.",
                transfer_destination: {
                    type: "predefined",
                    number: "{{support_transfer_number}}",
                },
                transfer_option: {
                    type: "cold_transfer",
                    cold_transfer_mode: "sip_invite",
                    show_transferee_as_caller: true,
                },
                ignore_e164_validation: false,
                speak_during_execution: false,
            } satisfies GeneralTool),

            ({
                type: "extract_dynamic_variable",
                name: "extract_qualification_data",
                description: "Extract the caller's qualification information and determine whether they are qualified, not qualified, or an existing customer.",
                variables: [
                    {
                        type: "string",
                        name: "caller_name",
                        description: "The full name of the caller.",
                    },
                    {
                        type: "string",
                        name: "company_size",
                        description: "The size of the caller's company or team.",
                    },
                    {
                        type: "string",
                        name: "current_tools",
                        description: "Current tools or solutions the caller is using.",
                    },
                    {
                        type: "string",
                        name: "pain_points",
                        description: "Challenges or pain points described by the caller.",
                    },
                    {
                        type: "string",
                        name: "timeline",
                        description: "Timeline for making a change.",
                    },
                    {
                        type: "enum",
                        name: "is_decision_maker",
                        description: "Whether the caller is the decision-maker.",
                        choices: ["yes", "no", "unknown"],
                    },
                    {
                        type: "enum",
                        name: "qualification_status",
                        description: "Overall qualification status. Qualified if there is a clear need, reasonable timeline, and decision-maker.",
                        choices: [
                            "qualified",
                            "not_qualified",
                            "existing_customer",
                        ],
                    },
                ],
            } satisfies GeneralTool),
        ] satisfies GeneralTool[],
    },

    llmConfig: {
        ...template.llmConfig,

        generalPrompt: `## Role

You are Grace, an SDR for {{company}}. You qualify inbound and outbound B2B leads for product demos.

## Guidelines

- Keep responses short and conversational.
- Ask one question at a time.
- Do not provide specific pricing, integration details, trial information, or implementation timelines.
- Defer commercial and technical details to the Account Executive.

## Hold / Pause Handling

If you are told:
- "Hold on"
- "One moment"
- "Please wait"
- Or something similar

Respond with exactly:

NO_RESPONSE_NEEDED

## Answer Caller Questions

Listen to the caller's question and match it to the FAQ Knowledge Base.

Provide a natural variation of the matching FAQ answer. Do not read the answer verbatim.

<*Wait for customer response*>

After answering, ask:

"Is there anything else I can help you with?"

<*Wait for customer response*>

If the caller has another question, repeat this step.

## Out Of Knowledge Handling

If the caller asks a question not covered in the FAQ Knowledge Base, respond exactly:

"That's a great question. This request needs assistance from another department. I can help connect you with the appropriate team. Is there anything else I can help you with before transferring you?"

<*Wait for customer response*>

Do not attempt to answer questions outside the FAQ Knowledge Base.

## FAQ Knowledge Base

### Product & Platform

**Q: What does Retell AI do? / What is your platform?**

A: Retell AI is a platform that lets businesses build and deploy AI-powered voice agents. These agents can handle inbound support, outbound outreach, appointment scheduling, and lead qualification.

**Q: How does the AI voice agent work?**

A: The agent combines large language models, real-time speech recognition, and text-to-speech to have natural phone conversations. It listens, understands intent, and responds conversationally.

**Q: What languages do you support?**

A: Retell AI supports languages including English, Spanish, French, German, and Portuguese. The Account Executive can confirm the full list.

**Q: Can I customize the voice and personality?**

A: Yes. You can choose from pre-built voices or bring your own, and customize the agent's name, tone, personality, and conversation flow.

### Pricing & Plans

**Q: How much does it cost?**

A: Pricing is usage-based and depends on call minutes and plan tier. The Account Executive can provide a tailored quote during the demo.

**Q: Is there a free trial?**

A: There are options for getting started and testing the platform. The Account Executive can explain availability and what's included.

**Q: Do you offer enterprise pricing?**

A: Enterprise plans are available with custom pricing, dedicated support, and additional compliance options. The Account Executive can discuss details.

### Integration & Setup

**Q: How long does setup take?**

A: Setup depends on your requirements and complexity. The Account Executive can provide a timeline for your use case.

**Q: What integrations do you support?**

A: The platform can connect with CRM, helpdesk, calendar, and backend systems. The Account Executive can confirm compatibility with your specific tools.

**Q: Do I need technical knowledge?**

A: Not necessarily. The platform includes a no-code interface. Advanced integrations may require technical resources.

**Q: Can it integrate with my phone system?**

A: The platform supports telephony integrations, including SIP-based connections. The Account Executive can confirm compatibility.

### Security & Compliance

**Q: Is the platform HIPAA compliant?**

A: HIPAA-compliant configurations may be available for healthcare use cases. The Account Executive can provide compliance details.

**Q: How do you handle data security?**

A: Security measures include encryption and access controls. Detailed security documentation can be provided during the demo.

**Q: Where is data stored?**

A: Data is stored on secure cloud infrastructure. The Account Executive can discuss data residency requirements.

### Use Cases & Capabilities

**Q: What use cases are supported?**

A: Customer support, outbound sales, lead qualification, appointment scheduling, order lookups, surveys, and other phone workflows.

**Q: Can it handle appointment scheduling?**

A: Yes. Agents can be configured to check availability, book appointments, send confirmations, and reschedule.

**Q: Can it transfer calls to a human?**

A: Yes. Agents can transfer calls to human representatives when configured conditions are met.

**Q: What if the AI cannot answer a question?**

A: It can transfer the caller to a human or offer a callback instead of guessing.

### Demo & Onboarding

**Q: What does the demo look like?**

A: A live walkthrough with an Account Executive, including a relevant use case and time for questions. It usually takes around 30 minutes.

**Q: How long is onboarding?**

A: Onboarding depends on complexity. The Account Executive can provide an estimate.

**Q: Do you provide setup support?**

A: Documentation is available, with additional onboarding and customer success support depending on the plan.`,
    },

    mainFlowConfig: {
        "begin-node": {
            id: "begin-node",
            type: "begin",
            name: "Begin",
            skippable: false,
            display_position: { x: 12, y: 326 },
            edge: {
                id: "begin-edge",
                destination_node_id: "node-b2b-greeting",
                transition_condition: {
                    type: "prompt",
                    prompt: "Always",
                },
            },
        },

        "node-b2b-greeting": {
            id: "node-b2b-greeting",
            type: "conversation",
            name: "Greeting",
            skippable: false,
            display_position: { x: 300, y: 326 },
            instruction: {
                type: "static_text",
                text: "Hi, this is Grace from {{company}}. Thanks for reaching out — we help businesses automate their phone calls with AI voice agents. Do you have a couple of minutes so I can learn a bit about your use case and see if we might be a good fit?",
            },
            edges: [
                {
                    id: "edge-greeting-to-name",
                    destination_node_id: "node-b2b-collect-name",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller responds and is ready to continue",
                    },
                },
            ],
        },

        "node-b2b-collect-name": {
            id: "node-b2b-collect-name",
            type: "conversation",
            name: "Collect Name",
            skippable: false,
            display_position: { x: 846, y: 366 },
            instruction: {
                type: "prompt",
                text: "Collect the customer's name",
            },
            edges: [
                {
                    id: "edge-name-to-dm",
                    destination_node_id: "node-b2b-decision-maker",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides their name",
                    },
                },
            ],
        },

        "node-b2b-decision-maker": {
            id: "node-b2b-decision-maker",
            type: "conversation",
            name: "Verify Decision-Maker",
            skippable: false,
            display_position: { x: 1400, y: 326 },
            instruction: {
                type: "prompt",
                text: "Ask the customer if they are typically the person that makes decisions on tools like Retell for their team.",
            },
            edges: [
                {
                    id: "edge-dm-yes-to-qualify",
                    destination_node_id: "node-b2b-qualify-component",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms they are the decision-maker",
                    },
                },
                {
                    id: "edge-dm-no-to-referral",
                    destination_node_id: "node-b2b-collect-referral",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller says they are NOT the decision-maker",
                    },
                },
            ],
        },

        "node-b2b-qualify-component": {
            id: "node-b2b-qualify-component",
            type: "subflow",
            name: "Qualification",
            skippable: false,
            display_position: { x: 1950, y: 246 },
            conversation_flow_component_id: "component-b2b-qualify-static",
            edges: [],
            else_edge: {
                id: "edge-qualify-static-else",
                destination_node_id: "node-b2b-extract",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-b2b-collect-referral": {
            id: "node-b2b-collect-referral",
            type: "conversation",
            name: "Collect Referral Info",
            skippable: false,
            display_position: { x: 1950, y: 654 },
            instruction: {
                type: "prompt",
                text: "Acknowledge the customer's response, try to get the name, title, and the best way to reach the right person for this call.",
            },
            edges: [
                {
                    id: "edge-referral-to-discovery",
                    destination_node_id: "node-b2b-offer-resources",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides information about the decision-maker",
                    },
                },
            ],
        },

        "node-b2b-offer-resources": {
            id: "node-b2b-offer-resources",
            type: "conversation",
            name: "Offer Resources",
            skippable: false,
            display_position: { x: 3054, y: 606 },
            instruction: {
                type: "prompt",
                text: "Let the customer know that you'd love to send some information the decision-maker can review before connecting. Ask for permission to send over material like an overview, a case study, or whatever would be most helpful.",
            },
            edges: [
                {
                    id: "edge-resources-to-callback",
                    destination_node_id: "node-b2b-schedule-dm-callback",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller responds about receiving materials",
                    },
                },
            ],
        },

        "node-b2b-schedule-dm-callback": {
            id: "node-b2b-schedule-dm-callback",
            type: "conversation",
            name: "Schedule DM Callback",
            skippable: false,
            display_position: { x: 3606, y: 942 },
            instruction: {
                type: "prompt",
                text: `Try to book a follow-up with the actual decision-maker:

"The best next step would be a quick call directly with an account executive. Could we find a time that works for them? Even 15 minutes would be enough for us to show them what we can do."

Collect their contact information.`,
            },
            edges: [
                {
                    id: "edge-dm-callback-to-extract",
                    destination_node_id: "node-1773851290633",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller provides callback details or confirms no callback needed",
                    },
                },
            ],
        },

        "node-b2b-extract": {
            id: "node-b2b-extract",
            type: "subagent",
            name: "Extract Qualification Data",
            skippable: false,
            display_position: { x: 4206, y: 294 },
            instruction: {
                type: "prompt",
                text: `Call extract_qualification_data to extract:

- caller_name
- company_size
- current_tools
- pain_points
- timeline
- is_decision_maker
- qualification_status

Classify qualification_status as:
- existing_customer: Caller is already a customer.
- qualified: Caller has a clear need, reasonable timeline, and is the decision-maker.
- not_qualified: Caller does not meet qualification criteria.

After extracting the variables, follow the appropriate transition.`,
            },
            tools: [
                {
                    type: "extract_dynamic_variable",
                    name: "extract_qualification_data",
                    description: "Extract the caller's qualification information.",
                    variables: [
                        {
                            type: "string",
                            name: "caller_name",
                            description: "The full name of the caller.",
                        },
                        {
                            type: "string",
                            name: "company_size",
                            description: "The size of the caller's company or team.",
                        },
                        {
                            type: "string",
                            name: "current_tools",
                            description: "Current tools or solutions the caller is using.",
                        },
                        {
                            type: "string",
                            name: "pain_points",
                            description: "Challenges or pain points described by the caller.",
                        },
                        {
                            type: "string",
                            name: "timeline",
                            description: "Timeline for making a change.",
                        },
                        {
                            type: "enum",
                            name: "is_decision_maker",
                            description: "Whether the caller is the decision-maker.",
                            choices: ["yes", "no", "unknown"],
                        },
                        {
                            type: "enum",
                            name: "qualification_status",
                            description: "Overall qualification status.",
                            choices: [
                                "qualified",
                                "not_qualified",
                                "existing_customer",
                            ],
                        },
                    ],
                },
            ],
            edges: [
                {
                    id: "edge-1773851002905-zz1hvwr3l",
                    destination_node_id: "node-b2b-existing",
                    transition_condition: {
                        type: "equation",
                        operator: "||",
                        equations: [
                            {
                                left: "{{qualification_status}}",
                                operator: "==",
                                right: "existing_customer",
                            },
                        ],
                    },
                },
                {
                    id: "edge-1773851020398-d0mg29r44",
                    destination_node_id: "node-b2b-confirm-ae",
                    transition_condition: {
                        type: "equation",
                        operator: "||",
                        equations: [
                            {
                                left: "{{qualification_status}}",
                                operator: "==",
                                right: "qualified",
                            },
                        ],
                    },
                },
            ],
            else_edge: {
                id: "node-b2b-extract-else-edge",
                destination_node_id: "node-b2b-decline",
                transition_condition: {
                    type: "prompt",
                    prompt: "Else",
                },
            },
        },

        "node-b2b-confirm-ae": {
            id: "node-b2b-confirm-ae",
            type: "conversation",
            name: "Confirm AE Transfer",
            skippable: false,
            display_position: { x: 5300, y: 100 },
            instruction: {
                type: "static_text",
                text: "This sounds like a great fit. Let me connect you with one of our Account Executives who can walk you through a personalized demo.",
            },
            edges: [],
            skip_response_edge: {
                id: "skip-b2b-ae",
                destination_node_id: "node-b2b-transfer-ae",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-b2b-transfer-ae": {
            id: "node-b2b-transfer-ae",
            type: "transfer_call",
            name: "Transfer to AE",
            skippable: false,
            display_position: { x: 5850, y: 100 },
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
                id: "edge-b2b-ae-failed",
                destination_node_id: "node-b2b-transfer-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "node-b2b-existing": {
            id: "node-b2b-existing",
            type: "conversation",
            name: "Existing Customer",
            skippable: false,
            display_position: { x: 5300, y: 400 },
            instruction: {
                type: "static_text",
                text: "It sounds like you are already working with us. Let me transfer you to our support team.",
            },
            edges: [],
            skip_response_edge: {
                id: "skip-b2b-support",
                destination_node_id: "node-b2b-transfer-support",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-b2b-transfer-support": {
            id: "node-b2b-transfer-support",
            type: "transfer_call",
            name: "Transfer to Support",
            skippable: false,
            display_position: { x: 5850, y: 350 },
            speak_during_execution: false,
            transfer_destination: {
                type: "predefined",
                number: "{{support_transfer_number}}",
            },
            transfer_option: {
                type: "cold_transfer",
                cold_transfer_mode: "sip_invite",
                show_transferee_as_caller: true,
            },
            custom_sip_headers: {},
            ignore_e164_validation: false,
            edge: {
                id: "edge-b2b-support-failed",
                destination_node_id: "node-b2b-transfer-failed",
                transition_condition: {
                    type: "prompt",
                    prompt: "Transfer failed",
                },
            },
        },

        "node-b2b-decline": {
            id: "node-b2b-decline",
            type: "conversation",
            name: "Polite Decline",
            skippable: false,
            display_position: { x: 5238, y: 774 },
            instruction: {
                type: "static_text",
                text: "Hey, really appreciate you taking the time to chat with me today. It sounds like this might not be the right fit for your team right now, but I’m glad we got to connect. If anything changes down the line, feel free to reach out anytime—happy to help.",
            },
            edges: [],
            skip_response_edge: {
                id: "skip-b2b-decline",
                destination_node_id: "node-b2b-wrap-up",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-b2b-transfer-failed": {
            id: "node-b2b-transfer-failed",
            type: "conversation",
            name: "Transfer Failed",
            skippable: false,
            display_position: { x: 6400, y: 500 },
            instruction: {
                type: "prompt",
                text: "Apologize, mention the team is not available right now. Ask to take the phone number and ask for a good time to callback.",
            },
            edges: [
                {
                    id: "edge-b2b-failed-done",
                    destination_node_id: "node-b2b-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "Caller confirms echo verification of phone number AND time to callback",
                    },
                },
                {
                    id: "edge-1775602591351-gogfur4ox",
                    destination_node_id: "node-b2b-wrap-up",
                    transition_condition: {
                        type: "prompt",
                        prompt: "customer declines",
                    },
                },
            ],
        },

        "node-b2b-wrap-up": {
            id: "node-b2b-wrap-up",
            type: "conversation",
            name: "Wrap Up",
            skippable: false,
            display_position: { x: 7000, y: 326 },
            instruction: {
                type: "prompt",
                text: "Acknowledge. Let them know to reach out if they have any other questions. End on a warm goodbye message.",
            },
            edges: [],
            skip_response_edge: {
                id: "skip-b2b-wrap",
                destination_node_id: "node-b2b-end",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },

        "node-b2b-end": {
            id: "node-b2b-end",
            type: "end",
            name: "End Call",
            skippable: false,
            display_position: { x: 7550, y: 326 },
            instruction: {
                type: "prompt",
                text: "End the call.",
            },
        },

        "node-1773851290633": {
            id: "node-1773851290633",
            type: "conversation",
            name: "Callback Acknowledgement",
            skippable: false,
            display_position: { x: 6990, y: 1134 },
            instruction: {
                type: "prompt",
                text: "Thank the customer for the information. If callback information was provided, tell them that you will be in touch. Do not ask the customer if there's anything else you can help them with.",
            },
            edges: [],
            skip_response_edge: {
                id: "skip-response-edge-1773851327905-uhbq8pmm6",
                destination_node_id: "node-b2b-end",
                transition_condition: {
                    type: "prompt",
                    prompt: "Skip response",
                },
            },
        },
    } satisfies MainflowSubflowConfig["mainFlowConfig"],

    subflowConfig: {
        "component-b2b-qualify-static": {
            conversation_flow_component_id: "component-b2b-qualify-static",
            name: "Qualification",
            flex_mode: true,

            nodes: [
                {
                    id: "node-q-start",
                    type: "subflow_start",
                    name: "Start",
                    skippable: false,
                    display_position: { x: 0, y: 100 },
                    edge: {
                        id: "edge-q-start",
                        destination_node_id: "node-q-team-size",
                        transition_condition: {
                            type: "prompt",
                            prompt: "Start",
                        },
                    },
                },

                {
                    id: "node-q-team-size",
                    type: "conversation",
                    name: "Ask Team Size",
                    skippable: false,
                    display_position: { x: 200, y: 100 },
                    instruction: {
                        type: "static_text",
                        text: "How large is your team or organization?",
                    },
                    edges: [
                        {
                            id: "edge-q-size-to-tools",
                            destination_node_id: "node-q-current-tools",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller answers the team size question",
                            },
                        },
                    ],
                },

                {
                    id: "node-q-current-tools",
                    type: "conversation",
                    name: "Ask Current Tools",
                    skippable: false,
                    display_position: { x: 700, y: 100 },
                    instruction: {
                        type: "static_text",
                        text: "What tools or solutions are you currently using?",
                    },
                    edges: [
                        {
                            id: "edge-q-tools-to-challenges",
                            destination_node_id: "node-q-challenges",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller answers the current tools question",
                            },
                        },
                    ],
                },

                {
                    id: "node-q-challenges",
                    type: "conversation",
                    name: "Ask Challenges",
                    skippable: false,
                    display_position: { x: 1200, y: 100 },
                    instruction: {
                        type: "static_text",
                        text: "What challenges are you running into with your current setup?",
                    },
                    edges: [
                        {
                            id: "edge-q-challenges-to-timeline",
                            destination_node_id: "node-q-timeline",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller answers the challenges question",
                            },
                        },
                    ],
                },

                {
                    id: "node-q-timeline",
                    type: "conversation",
                    name: "Ask Timeline",
                    skippable: false,
                    display_position: { x: 1700, y: 100 },
                    instruction: {
                        type: "static_text",
                        text: "What does your timeline look like for making a change?",
                    },
                    edges: [
                        {
                            id: "edge-q-timeline-to-summary",
                            destination_node_id: "node-q-summary-confirm",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller answers the timeline question",
                            },
                        },
                    ],
                },

                {
                    id: "node-q-summary-confirm",
                    type: "conversation",
                    name: "Summary and Confirm",
                    skippable: false,
                    display_position: { x: 2200, y: 100 },
                    instruction: {
                        type: "prompt",
                        text: 'Summarize all the answers back to the caller: reference their team size, current tools, main challenges, and timeline. Then ask: "Does that sound right?"',
                    },
                    edges: [
                        {
                            id: "edge-q-summary-to-exit",
                            destination_node_id: "node-q-exit",
                            transition_condition: {
                                type: "prompt",
                                prompt: "Caller confirms the summary is accurate",
                            },
                        },
                    ],
                },

                {
                    id: "node-q-exit",
                    type: "subflow_end",
                    name: "Exit Component",
                    skippable: false,
                    display_position: { x: 2700, y: 100 },
                },
            ],
        },
    } satisfies MainflowSubflowConfig["subflowConfig"],
}