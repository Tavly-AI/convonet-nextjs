import type { XYPosition } from "@xyflow/react"
import type { CF } from "../_types/global-cf-types"
import { subflow_session_storage } from "./flow-subflow-sessonStorage"

type NodeFactoryMap = Record<CF["Type"], (id: string, position: XYPosition, subflowId?: string) => CF["Node"]["data"]>

const nodeFactories: NodeFactoryMap = {
    begin: (id, position) => ({
        id,
        type: "begin",
        name: "Begin",
        skippable: false,
        edge: {
            id: crypto.randomUUID(),
            transition_condition: { type: "prompt", prompt: "Start" },
        },
        display_position: position,
    }),

    conversation: (id, position) => ({
        id,
        type: "conversation",
        name: "Conversation",
        skippable: false,
        start_speaker: "agent",
        instruction: {
            type: "prompt",
            text: "",
        },
        edges: [],
        display_position: position,
    }),

    subagent: (id, position) => ({
        id,
        type: "subagent",
        name: "Subagent",
        skippable: false,
        instruction: {
            type: "prompt",
            text: "",
        },
        edges: [
            {
                id: crypto.randomUUID(),
                transition_condition: {
                    type: "prompt",
                    prompt: "Describe the transition condition",
                },
            },
        ],
        display_position: position,
    }),
    transfer_call: (id, position) => ({
        id,
        type: "transfer_call",
        name: "Transfer Call",
        skippable: false,
        speak_during_execution: false,
        transfer_destination: {
            type: "predefined",
            number: "",
        },
        transfer_option: {
            type: "cold_transfer",
            show_transferee_as_caller: false,
        },
        edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Transfer failed",
            },
        },
        custom_sip_headers: {},
        ignore_e164_validation: false,
        display_position: position,
    }),
    press_digit: (id, position) => ({
        id,
        type: "press_digit",
        name: "Press Digit",
        skippable: false,
        instruction: { type: "prompt", text: "" },
        delay_ms: 1000,
        edges: [],
        display_position: position,
    }),
    branch: (id, position) => ({
        id,
        type: "branch",
        name: "Logic Split",
        skippable: false,
        edges: [],
        else_edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Else",
            },
        },
        display_position: position,
    }),
    agent_swap: (id, position) => ({
        id,
        type: "agent_swap",
        name: "Agent Transfer",
        skippable: false,
        agent_id: "",
        agent_version: 0,
        keep_current_language: false,
        use_swap_agent_max_duration: false,
        keep_current_voice: false,
        post_call_analysis_setting: "only_destination_agent",
        webhook_setting: "only_source_agent",
        speak_during_execution: false,
        edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Transfer failed",
            },
        },
        display_position: position,
    }),
    sms: (id, position) => ({
        id,
        type: "sms",
        name: "In-Call SMS",
        skippable: false,
        instruction: { type: "prompt", text: "" },
        success_edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Sent successfully",
            },
        },
        failed_edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Failed to send",
            },
        },
        display_position: position,
    }),
    function: (id, position) => ({
        id,
        type: "function",
        name: "Custom Function",
        skippable: false,
        edges: [{
            id: crypto.randomUUID(),
            transition_condition: { type: "prompt", prompt: "Continue" },
        }],
        display_position: position,
    }),
    code: (id, position) => ({
        id,
        type: "code",
        name: "Code",
        skippable: false,
        enable_typing_sound: false,
        code: "",
        wait_for_result: true,
        speak_during_execution: false,
        edges: [],
        else_edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Else",
            },
        },
        display_position: position,
    }),
    end: (id, position) => ({
        id,
        type: "end",
        name: "End Call",
        skippable: false,
        instruction: { type: "prompt", text: "Politely end the call" },
        display_position: position,
    }),
    subflow_start: (id, position) => ({
        id,
        type: "subflow_start",
        name: "Start",
        skippable: false,
        edge: {
            id: crypto.randomUUID(),
            transition_condition: {
                type: "prompt",
                prompt: "Start",
            },
        },
        display_position: position,
    }),

    subflow_end: (id, position) => ({
        id,
        type: "subflow_end",
        name: "End",
        skippable: false,
        display_position: position,
    }),

    subflow: (id, position, subflowId) => {

        if (!subflowId) throw new Error("Subflow ID is required")
        const subflow = subflow_session_storage.get(subflowId)
        if (!subflow) throw new Error(`Subflow ${subflowId} not found`)

        return {
            id,
            type: "subflow",
            name: subflow.name,
            skippable: false,
            conversation_flow_component_id: subflowId,
            edges: [{
                id: crypto.randomUUID(),
                transition_condition: {
                    type: "prompt",
                    prompt: "Continue",
                },
            }],
            display_position: position,
        }
    },
}


export function createCFNode(nodeType: CF["Type"], position: XYPosition, referencedSubflowId?: string): CF["Node"]["data"] {

    if (nodeType === "subflow" && !referencedSubflowId) { throw new Error("Referenced subflow ID is required") }

    return nodeFactories[nodeType](crypto.randomUUID(), position, referencedSubflowId)
}