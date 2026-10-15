import { TemplateDeliveryStatusCaller } from "./conversational-flow-templates/delivery-status-caller"
import { TemplateEventWebinarReminder } from "./conversational-flow-templates/event-webinar-reminder"
import { TemplateLiveCallTranslator } from "./conversational-flow-templates/live-call-translator"
import { getAgentTemplates, type AgentTemplateId } from "./templates-data-list"
import type { MainflowSubflowConfig } from "@/app/agents-conversational-flow/_types/global-cf-types"

import type { GeneralTool } from "@/app/agents/_lib/functions/general-tools"
import { TemplateReminderNoShowReducer } from "./conversational-flow-templates/reminder-no-show-reducer"
import { TemplateWinBackCampaign } from "./conversational-flow-templates/win-back-campaign"
import { TemplateFAQVoiceAgent } from "./conversational-flow-templates/faq-voice-agent"
import { TemplateSupportTriage } from "./conversational-flow-templates/support-triage"
import { TemplateInsurance } from "./conversational-flow-templates/insurance"
import { TemplateIVRNavigationPaymentBot } from "./conversational-flow-templates/ivr-navigation-payment-bot"
import { TemplateOutreachDialer } from "./conversational-flow-templates/outreach-dialer"
import { TemplateRiderAppointmentBooking } from "./conversational-flow-templates/rider-appointment-booking"
import { TemplateB2BDemoQualification } from "./conversational-flow-templates/b2b-demo-qualification"
import { TemplatePharmacyRefill } from "./conversational-flow-templates/pharmacy-refill"

type ConversationalFlowTemplateMap = {
    [K in keyof ReturnType<typeof getAgentTemplates>]?: {
        name: ReturnType<typeof getAgentTemplates>[K]["name"]
        config: {
            agentType: "single_prompt" | "conversational_flow"
            generalTools: GeneralTool[]
        }
        llmConfig: {
            generalPrompt: string
        }
    } & MainflowSubflowConfig
}

export function getConversationalFlowTemplates() {

    return {
        "live-call-translator": TemplateLiveCallTranslator,
        "delivery-status-caller": TemplateDeliveryStatusCaller,
        "event-webinar-reminder": TemplateEventWebinarReminder,
        "reminder-no-show-reducer": TemplateReminderNoShowReducer,
        "win-back-campaign": TemplateWinBackCampaign,
        "faq-voice-agent": TemplateFAQVoiceAgent,
        "support-triage": TemplateSupportTriage,
        "pharmacy-refill": TemplatePharmacyRefill, // go-back-condition

        // sublflow
        "insurance": TemplateInsurance,
        "ivr-navigation-payment-bot": TemplateIVRNavigationPaymentBot,
        "outreach-dialer": TemplateOutreachDialer,
        "rider-appointment-booking": TemplateRiderAppointmentBooking,

        // extract_dynamic_variable
        // "b2b-demo-qualification": TemplateB2BDemoQualification // has skip_response_edge


    } satisfies ConversationalFlowTemplateMap
}