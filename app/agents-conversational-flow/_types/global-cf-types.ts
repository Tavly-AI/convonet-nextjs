import type { Node, XYPosition } from "@xyflow/react"

type Instruction =
    | {
        type: "prompt"
        text: string
    }
    | {
        type: "static_text"
        text: string
    }

export type EquationOperator = "==" | "!=" | ">" | ">=" | "<" | "<="

export type TransitionCondition =
    | { type: "prompt"; prompt: string }
    | {
        type: "equation"
        operator: "&&" | "||"
        equations: Array<{ left: string; operator: EquationOperator; right: string }>
    }

type Edge = {
    id: string
    transition_condition: TransitionCondition
    destination_node_id?: string
}

type Base<T extends string> = {
    id: string
    type: T
    name: string
    skippable: boolean
    display_position: XYPosition
}

type Data = {
    begin: Base<"begin"> & {
        edge: Edge
    }

    conversation: Base<"conversation"> & {
        start_speaker?: "agent" | "user"
        instruction: Instruction
        edges?: Edge[]
        else_edge?: Edge
        always_edge?: Edge
    }

    subagent: Base<"subagent"> & {
        instruction: {
            type: "prompt"
            text: string
        }
        edges?: Edge[]
        else_edge?: Edge
        always_edge?: Edge
    }

    transfer_call: Base<"transfer_call"> & {
        speak_during_execution: boolean
        transfer_destination: {
            type: "predefined"
            number: string
        }
        transfer_option: {
            type: "cold_transfer"
            show_transferee_as_caller: boolean
        }
        edge: Edge
        custom_sip_headers: Record<string, string>
        ignore_e164_validation: boolean
    }

    press_digit: Base<"press_digit"> & {
        instruction: Instruction
        delay_ms: number
        edges?: Edge[]
        else_edge?: Edge
    }

    branch: Base<"branch"> & {
        edges: Edge[]
        else_edge: Edge
    }

    agent_swap: Base<"agent_swap"> & {
        agent_id: string
        agent_version: number
        keep_current_language: boolean
        keep_current_voice: boolean
        use_swap_agent_max_duration: boolean
        post_call_analysis_setting: "only_destination_agent"
        webhook_setting: "only_source_agent"
        speak_during_execution: boolean
        edge: Edge
    }

    sms: Base<"sms"> & {
        instruction: Instruction
        success_edge: Edge
        failed_edge: Edge
    }

    code: Base<"code"> & {
        enable_typing_sound: boolean
        code: string
        wait_for_result: boolean
        speak_during_execution: boolean
        edges: Edge[]
        else_edge: Edge
    }

    end: Base<"end"> & {
        instruction: Instruction
    }
}

export type CF = {
    Data: Data
    Type: keyof Data
    Nodes: {
        [K in keyof Data]: Node<Data[K], K>
    }
    Node: CF["Nodes"][keyof CF["Nodes"]]
    Edge: Edge
    Instruction: Instruction
}
