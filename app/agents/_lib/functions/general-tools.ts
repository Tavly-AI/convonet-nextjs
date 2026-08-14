export type KeyValue = {
  key: string
  value: string
}

export type EndCallTool = {
  type: "end_call"
  name: string
  description: string
}

export type TransferMode = "cold_transfer" | "warm_transfer" | "agentic_warm_transfer"

export type TransferCallTool = {
  type: "transfer_call"
  name: string
  description: string
  transfer_destination: {
    type: "predefined" | "dynamic"
    number: string
    ignore_e164_validation: boolean
    extension: string
  }
  transfer_option: {
    type: TransferMode
    show_transferee_as_caller: boolean
    sip_transfer_method: "invite" | "refer"
    ring_duration_ms: number
    on_hold_music: "ringtone" | "none"
    navigate_ivr: boolean
    has_internal_queue: boolean
    wait_for_answer_ms: number
    whisper_message: string
    three_way_ringtone: boolean
    three_way_message: string
    transfer_agent_id: string
    action_on_timeout: "cancel_transfer" | "bridge_transfer"
  }
  custom_sip_headers: KeyValue[]
}

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

export type GeneralTool = EndCallTool | TransferCallTool | CustomFunctionTool
