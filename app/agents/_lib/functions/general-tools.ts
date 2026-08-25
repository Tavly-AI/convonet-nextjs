export type KeyValue = {
  key: string
  value: string
}

export type EndCallTool = {
  type: "end_call"
  name: string
  description: string
} & ExecutionMessageFields

export type ExecutionMessageType = "prompt" | "static_text"

export type ExecutionMessageFields = {
  speak_during_execution?: boolean
  execution_message_type?: ExecutionMessageType
  execution_message_description?: string
}

export type TransferMode = "cold_transfer" | "warm_transfer" | "agentic_warm_transfer"

export type TransferDestination =
  | {
      type: "predefined"
      number: string
      extension?: string
    }
  | {
      type: "inferred"
      prompt: string
    }

export type TransferHoldMusic =
  | "none"
  | "relaxing_sound"
  | "uplifting_beats"
  | "ringtone"
  | "custom"

export type TransferHandoffOption =
  | {
      type: "prompt"
      prompt: string
    }
  | {
      type: "static_message"
      message: string
    }

export type TransferOption =
  | {
      type: "cold_transfer"
      cold_transfer_mode?: "sip_refer" | "sip_invite"
      show_transferee_as_caller?: boolean
      transfer_ring_duration_ms?: number
    }
  | {
      type: "warm_transfer"
      agent_detection_timeout_ms?: number
      custom_on_hold_music_asset_id?: string
      enable_bridge_audio_cue?: boolean
      ivr_option?: {
        type?: "prompt"
        prompt?: string
      }
      on_hold_music?: TransferHoldMusic
      opt_out_human_detection?: boolean
      private_handoff_option?: TransferHandoffOption | null
      public_handoff_option?: TransferHandoffOption | null
      show_transferee_as_caller?: boolean
      transfer_ring_duration_ms?: number
    }
  | {
      type: "agentic_warm_transfer"
      agentic_transfer_config: {
        action_on_timeout?: "cancel_transfer" | "bridge_transfer"
        transfer_agent?: {
          agent_id: string
          agent_version: string | number
        }
        transfer_timeout_ms?: number
      }
      custom_on_hold_music_asset_id?: string
      enable_bridge_audio_cue?: boolean
      on_hold_music?: TransferHoldMusic
      public_handoff_option?: TransferHandoffOption | null
      show_transferee_as_caller?: boolean
      transfer_ring_duration_ms?: number
    }

export type TransferCallTool = {
  type: "transfer_call"
  name: string
  description: string
  transfer_destination: TransferDestination
  transfer_option: TransferOption
  custom_sip_headers?: Record<string, string>
  ignore_e164_validation?: boolean
} & ExecutionMessageFields

export type FunctionParameter = {
  name: string
  type: "string" | "number" | "boolean" | "object" | "array"
  description: string
  required: boolean
}

export type CustomFunctionTool = {
  type: "custom"
  name: string
  description: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: string
  timeout_ms: number
  headers: KeyValue[]
  query_params: KeyValue[]
  parameters: Record<string, unknown>
  parameters_json: string
  parameter_mode: "form" | "json"
  parameter_fields: FunctionParameter[]
  args_only: boolean
  response_variables: KeyValue[]
  speak_during_execution: {
    enabled: boolean
    type: "prompt" | "static"
    text: string
  }
  speak_after_execution: boolean
  max_retry: number
}

export type CheckAvailabilityCalTool = {
  type: "check_availability_cal"
  name: string
  description: string
  cal_api_key: string
  event_type_id: number | string
  timezone: string
}

export type BookAppointmentCalTool = {
  type: "book_appointment_cal"
  name: string
  description: string
  cal_api_key: string
  event_type_id: number | string
  timezone: string
}

export type PressDigitTool = {
  type: "press_digit"
  name: string
  description: string
  delay_ms: number
}

export type BridgeTransferTool = {
  type: "bridge_transfer"
  name: string
  description: string
} & ExecutionMessageFields

export type CancelTransferTool = {
  type: "cancel_transfer"
  name: string
  description: string
} & ExecutionMessageFields

export type GeneralTool =
  | EndCallTool
  | TransferCallTool
  | CustomFunctionTool
  | CheckAvailabilityCalTool
  | BookAppointmentCalTool
  | PressDigitTool
  | BridgeTransferTool
  | CancelTransferTool
