import type { XYPosition } from "@xyflow/react"
import type { CF } from "../_types/global-cf-types"

type NodeFactoryMap = Record<CF["Type"], (id: string, position: XYPosition) => CF["Node"]["data"]>

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
}

export function createCFNode(type: CF["Type"], position: XYPosition): CF["Node"]["data"] {
    return nodeFactories[type](crypto.randomUUID(), position)
}
