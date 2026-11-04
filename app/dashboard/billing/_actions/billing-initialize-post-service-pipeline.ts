import "server-only"
import { parsePhoneNumberFromString } from "libphonenumber-js/max"

import { BILLING_GLOBAL_CONFIG_VALUES } from "../_lib/payment-config"
import { AGENT_CHANNELS } from "@/lib/constants"
import type { BillingGlobalTypes } from "../_lib/billing-global-types"
import { billing_DB_chargeCall } from "./billing-db-actions"
import { prisma } from "@/lib/prisma"

export async function billingInitializePostServiceBillingPipeline(input: BillingGlobalTypes["PostServiceInput"]) {

    const { body, agent, durationMs: sessionDurationMs } = input
    const sessionDurationMinutes = sessionDurationMs / 60000

    const { billing_ttsCost, billing_ttsUnitPrice } = calculateTTSCost(agent.channel === AGENT_CHANNELS.VOICE ? sessionDurationMinutes : 0, body)
    const { billing_sttCost, billing_sttUnitPrice } = calculateSTTCost(agent.channel === AGENT_CHANNELS.VOICE ? sessionDurationMinutes : 0, body)
    const billing_llmCost = agent.channel === AGENT_CHANNELS.VOICE ? calculateLLMCost(sessionDurationMinutes, agent.llmConfig.model) : 0
    const billing_llmCost_butChatAgent = agent.channel === AGENT_CHANNELS.CHAT ? calculateLLMCostButChatAgent(body, agent.llmConfig.model) : 0

    // addons
    const billing_surchargeCost = calculateShortCallSurcharge(sessionDurationMs)
    const billing_kbCost = calculateKBCost(sessionDurationMinutes, body)
    const billing_batchCallCost = await calculateBatchCallCost(body.report.room, agent.workspaceId)
    const billing_safetyGuardrailsCost = calculateSafteyGuardRails_Costs(sessionDurationMinutes, agent.config)
    const billing_piiRemovalCost = calculatePIIRemovalCost(sessionDurationMinutes, agent.config)
    const billing_advancedDenoisingCost = calculateAdvancedDenoisingCost(sessionDurationMinutes, agent)
    const billing_telephony = await calculateTelephonyRateCost(sessionDurationMinutes, body, agent)
    const billing_totalCost = billing_ttsCost + billing_sttCost + billing_llmCost + billing_llmCost_butChatAgent + billing_surchargeCost + billing_kbCost + billing_batchCallCost + billing_safetyGuardrailsCost + billing_piiRemovalCost + billing_advancedDenoisingCost + billing_telephony.cost
    const billing_llmTokenSurcharge = calculateLLM_tokenSurcharge(sessionDurationMinutes, body)

    // attached with billingUnitByProduct in app/dashboard/call-history/_components/call-history-table-client.tsx
    const billing_callCost: BillingGlobalTypes["CallCost"] = {
        product_costs: [
            { product: "telephony", cost: billing_telephony.cost, unit_price: billing_telephony.unit_price, is_transfer_leg_cost: false },
            { product: "tts", cost: billing_ttsCost, unit_price: billing_ttsUnitPrice, is_transfer_leg_cost: false },
            { product: "stt", cost: billing_sttCost, unit_price: billing_sttUnitPrice, is_transfer_leg_cost: false },
            { product: "llm", cost: billing_llmCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.llm[agent.llmConfig.model] ?? 0, is_transfer_leg_cost: false },
            { product: "chat_llm", cost: billing_llmCost_butChatAgent, unit_price: BILLING_GLOBAL_CONFIG_VALUES.chatLlm[agent.llmConfig.model] ?? 0, is_transfer_leg_cost: false },
            { product: "short_call_surcharge", cost: billing_surchargeCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.config.callSurchargePenatly, is_transfer_leg_cost: false },
            { product: "kb", cost: billing_kbCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerMinute, is_transfer_leg_cost: false },
            { product: "batch_call", cost: billing_batchCallCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.batchCall.pricePerDial, is_transfer_leg_cost: false },
            { product: "safety_guardrails", cost: billing_safetyGuardrailsCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.safetyGuardrails.pricePerMinute, is_transfer_leg_cost: false },
            { product: "pii_removal", cost: billing_piiRemovalCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.piiRemoval.pricePerMinute, is_transfer_leg_cost: false },
            { product: "advanced_denoising", cost: billing_advancedDenoisingCost, unit_price: BILLING_GLOBAL_CONFIG_VALUES.advancedDenoising.pricePerMinute, is_transfer_leg_cost: false },
            { product: "llm_token_surcharge", cost: billing_llmTokenSurcharge, unit_price: BILLING_GLOBAL_CONFIG_VALUES.llmTokenSurcharge.pricePerMinute, is_transfer_leg_cost: false, },

        ],
        total_duration_seconds: sessionDurationMs / 1000,
        total_duration_unit_price: 0,
        combined_cost: billing_totalCost,
    }

    await billing_DB_chargeCall({
        workspaceId: agent.workspaceId,
        callId: body.report.room,
        amount: billing_totalCost,
        callCost: billing_callCost,
    })
}


function calculateTTSCost(minutes: number, body: BillingGlobalTypes["PostServiceInput"]["body"]) {
    const usage = body.report.usage?.find(u => u.type === "tts_usage")
    const model = String(usage?.model ?? "") as keyof typeof BILLING_GLOBAL_CONFIG_VALUES.tts
    const unit_price = BILLING_GLOBAL_CONFIG_VALUES.tts[model] ?? 0

    return { billing_ttsCost: minutes * unit_price, billing_ttsUnitPrice: unit_price }
}

function calculateSTTCost(minutes: number, body: BillingGlobalTypes["PostServiceInput"]["body"]) {
    const usage = body.report.usage?.find(u => u.type === "stt_usage")
    const unit_price = usage ? BILLING_GLOBAL_CONFIG_VALUES.stt.deepgram["nova-3"] : 0

    return { billing_sttCost: minutes * unit_price, billing_sttUnitPrice: unit_price }
}

function calculateLLMCost(minutes: number, model: keyof typeof BILLING_GLOBAL_CONFIG_VALUES.llm) {
    const rate = BILLING_GLOBAL_CONFIG_VALUES.llm[model]
    return minutes * (rate ?? 0)
}

function calculateLLMCostButChatAgent(body: BillingGlobalTypes["PostServiceInput"]["body"], model: keyof typeof BILLING_GLOBAL_CONFIG_VALUES.chatLlm) {
    const unit_price = BILLING_GLOBAL_CONFIG_VALUES.chatLlm[model]
    if (unit_price === undefined) throw new Error(`Missing chat billing rate for model: ${model}`)

    const messageCount = body.report.chat_history.items.filter(item => item.type === "message" && item.role === "assistant" && item.content?.some(value => typeof value === "string" && value.trim())).length
    return messageCount * unit_price
}

// https://docs.retellai.com/accounts/billing-exceptions#rule-1-minimum-duration-for-dynamic-opening-messages
function calculateShortCallSurcharge(durationMs: number) {
    return durationMs < 10_000 ? BILLING_GLOBAL_CONFIG_VALUES.config.callSurchargePenatly : 0
}

// connected with TranscriptMessageButTool() in app/dashboard/call-history/_components/call-history-sidebar.tsx
function calculateKBCost(minutes: number, body: BillingGlobalTypes["PostServiceInput"]["body"]) {
    const hasKnowledgeBase = body.report.chat_history.items.some(
        item => item.type === "function_call" && item.name === "search_knowledge_base"
    )

    return hasKnowledgeBase ? minutes * BILLING_GLOBAL_CONFIG_VALUES.kb.pricePerMinute : 0
}

async function calculateBatchCallCost(callId: string, workspaceId: string) {
    const callRecord = await prisma.callRecord.findUniqueOrThrow({
        where: { call_id: callId, workspaceId },
        select: { batchCallId: true },
    })

    return callRecord.batchCallId ? BILLING_GLOBAL_CONFIG_VALUES.batchCall.pricePerDial : 0
}

// https://docs.retellai.com/accounts/billing-exceptions#rule-2-llm-price-scaling-for-%3E-4000-token-prompt-length
function calculateLLM_tokenSurcharge(minutes: number, body: BillingGlobalTypes["PostServiceInput"]["body"]) {
    const inputTokens = body.report.usage?.filter(u => u.type === "llm_usage").reduce((total, u) => total + Number(u.input_tokens ?? 0), 0) ?? 0
    const { threshold, pricePerMinute } = BILLING_GLOBAL_CONFIG_VALUES.llmTokenSurcharge
    return inputTokens > threshold ? minutes * pricePerMinute : 0
}

function calculateSafteyGuardRails_Costs(minutes: number, config: BillingGlobalTypes["PostServiceInput"]["agent"]["config"]) {
    const guardrails = config.guardrail_config
    const hasGuardrails = (guardrails?.input_topics?.length ?? 0) > 0 || (guardrails?.output_topics?.length ?? 0) > 0

    return hasGuardrails ? minutes * BILLING_GLOBAL_CONFIG_VALUES.safetyGuardrails.pricePerMinute : 0
}

function calculatePIIRemovalCost(minutes: number, config: BillingGlobalTypes["PostServiceInput"]["agent"]["config"]) {
    const hasPIIRemoval = (config.pii_config?.categories?.length ?? 0) > 0
    return hasPIIRemoval ? minutes * BILLING_GLOBAL_CONFIG_VALUES.piiRemoval.pricePerMinute : 0
}

function calculateAdvancedDenoisingCost(minutes: number, agent: BillingGlobalTypes["PostServiceInput"]["agent"]) {
    const hasAdvancedDenoising = agent.channel === AGENT_CHANNELS.VOICE && agent.config.denoising_mode === "noise-and-background-speech-cancellation"
    return hasAdvancedDenoising ? minutes * BILLING_GLOBAL_CONFIG_VALUES.advancedDenoising.pricePerMinute : 0
}


async function calculateTelephonyRateCost(minutes: number, body: BillingGlobalTypes["PostServiceInput"]["body"], agent: BillingGlobalTypes["PostServiceInput"]["agent"],) {

    const noCharge = { cost: 0, unit_price: 0 }
    if (agent.channel !== AGENT_CHANNELS.VOICE || (body.callType !== "inbound" && body.callType !== "outbound")) return noCharge

    const ownedNumber = body.callType === "outbound" ? body.fromNumber : body.toNumber
    if (!ownedNumber) return noCharge

    const phoneNumber = await prisma.phoneNumber.findFirst({
        where: { phoneNumber: ownedNumber, workspaceId: agent.workspaceId },
        select: { providerType: true },
    })
    if (phoneNumber?.providerType !== "twilio") return noCharge

    // Outbound destination or inbound receiving number; never rate by the caller's country.
    const ratedNumber = body.toNumber ? parsePhoneNumberFromString(body.toNumber, { extract: false }) : undefined

    const unit_price =
        (ratedNumber?.country ? (BILLING_GLOBAL_CONFIG_VALUES.telephony.twilio.countryRates as Record<string, number>)[ratedNumber.country] : undefined)
        ?? BILLING_GLOBAL_CONFIG_VALUES.telephony.twilio.defaultPricePerMinute

    return { cost: minutes * unit_price, unit_price }
}
