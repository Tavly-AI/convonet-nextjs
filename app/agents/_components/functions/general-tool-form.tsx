"use client"

import * as React from "react"
import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { KeyValueEditor } from "@/app/agents/_components/shared/key-value-editor"
import type {
  BookAppointmentCalTool,
  BridgeTransferTool,
  CancelTransferTool,
  CheckAvailabilityCalTool,
  CustomFunctionTool,
  EndCallTool,
  ExecutionMessageFields,
  FunctionParameter,
  GeneralTool,
  PressDigitTool,
} from "@/app/agents/_lib/functions/general-tools"
import { Section } from "../speech-settings/speech-settings"
import { TransferCallForm } from "./transfer-call-tool-form"

export function GeneralToolForm({
  value,
  onChange,
}: {
  value: GeneralTool
  onChange: (value: GeneralTool) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            placeholder="function_name"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea
              value={value.description}
              onChange={(event) => onChange({ ...value, description: event.target.value })}
              placeholder="Explain exactly when the agent should use this function."
            />
          </Field>
        </div>
      </div>

      {value.type === "end_call" && (
        <EndCallForm value={value} onChange={onChange} />
      )}
      {value.type === "transfer_call" && (
        <TransferCallForm value={value} onChange={onChange} />
      )}
      {(value.type === "check_availability_cal" || value.type === "book_appointment_cal") && (
        <CalComToolForm value={value} onChange={onChange} />
      )}
      {value.type === "press_digit" && (
        <PressDigitForm value={value} onChange={onChange} />
      )}
      {(value.type === "bridge_transfer" || value.type === "cancel_transfer") && (
        <TransferDecisionForm value={value} onChange={onChange} />
      )}
      {value.type === "custom" && (
        <CustomFunctionForm value={value} onChange={onChange} />
      )}
    </div>
  )
}

function EndCallForm({
  value,
  onChange,
}: {
  value: EndCallTool
  onChange: (value: EndCallTool) => void
}) {
  return (
    <Section title="Conversation behavior">
      <ExecutionMessageForm value={value} onChange={onChange} />
    </Section>
  )
}

function CalComToolForm({
  value,
  onChange,
}: {
  value: CheckAvailabilityCalTool | BookAppointmentCalTool
  onChange: (value: CheckAvailabilityCalTool | BookAppointmentCalTool) => void
}) {
  return (
    <Section title="Cal.com">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="API key">
          <Input
            value={value.cal_api_key}
            onChange={(event) => onChange({ ...value, cal_api_key: event.target.value })}
            placeholder="cal_live_xxxxxxxxxxxx"
          />
        </Field>
        <Field label="Event type ID">
          <Input
            value={String(value.event_type_id)}
            onChange={(event) => onChange({ ...value, event_type_id: event.target.value })}
            placeholder="60444 or {{event_type_id}}"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Timezone">
            <Input
              value={value.timezone}
              onChange={(event) => onChange({ ...value, timezone: event.target.value })}
              placeholder="America/Los_Angeles or {{timezone}}"
            />
          </Field>
        </div>
      </div>
    </Section>
  )
}

function PressDigitForm({
  value,
  onChange,
}: {
  value: PressDigitTool
  onChange: (value: PressDigitTool) => void
}) {
  return (
    <Section title="Digit timing">
      <NumberField
        label="Delay before pressing (ms)"
        value={value.delay_ms}
        min={0}
        max={5000}
        onChange={(delay_ms) => onChange({ ...value, delay_ms })}
      />
    </Section>
  )
}

function TransferDecisionForm({
  value,
  onChange,
}: {
  value: BridgeTransferTool | CancelTransferTool
  onChange: (value: BridgeTransferTool | CancelTransferTool) => void
}) {
  return (
    <Section title="Conversation behavior">
      <ExecutionMessageForm value={value} onChange={onChange} />
    </Section>
  )
}

function ExecutionMessageForm<T extends ExecutionMessageFields>({
  value,
  onChange,
}: {
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-4">
      <CheckRow
        label="Talk while running"
        description="Say something when this tool is called."
        checked={value.speak_during_execution ?? false}
        onCheckedChange={(speak_during_execution) =>
          onChange({ ...value, speak_during_execution })
        }
      />
      {value.speak_during_execution && (
        <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Message type">
            <Select
              value={value.execution_message_type ?? "prompt"}
              onValueChange={(execution_message_type) =>
                onChange({
                  ...value,
                  execution_message_type: execution_message_type as ExecutionMessageFields["execution_message_type"],
                })
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">Prompt</SelectItem>
                <SelectItem value="static_text">Static sentence</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Message">
            <Textarea
              value={value.execution_message_description ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  execution_message_description: event.target.value,
                })
              }
              placeholder="Let me connect you now."
            />
          </Field>
        </div>
      )}
    </div>
  )
}

function CustomFunctionForm({
  value,
  onChange,
}: {
  value: CustomFunctionTool
  onChange: (value: CustomFunctionTool) => void
}) {
  const supportsBody = ["POST", "PUT", "PATCH"].includes(value.method)

  return (
    <>
      <Section title="API request">
        <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
          <Field label="Method">
            <Select
              value={value.method}
              onValueChange={(method) => onChange({ ...value, method: method as CustomFunctionTool["method"] })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((method) => (
                  <SelectItem key={method} value={method}>{method}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="API endpoint">
            <Input
              type="url"
              value={value.url}
              onChange={(event) => onChange({ ...value, url: event.target.value })}
              placeholder="https://api.example.com/action"
            />
          </Field>
          <div className="sm:col-span-2">
            <NumberField
              label="Timeout (ms)"
              value={value.timeout_ms}
              onChange={(timeout_ms) => onChange({ ...value, timeout_ms })}
            />
          </div>
        </div>
      </Section>

      <Section title="Headers">
        <KeyValueEditor
          value={value.headers}
          onChange={(headers) => onChange({ ...value, headers })}
          keyPlaceholder="Authorization"
          valuePlaceholder="Bearer {{token}}"
        />
      </Section>

      <Section title="Query parameters">
        <KeyValueEditor
          value={value.query_params}
          onChange={(query_params) => onChange({ ...value, query_params })}
          keyPlaceholder="customer_id"
          valuePlaceholder="{{customer_id}}"
        />
      </Section>

      {supportsBody && (
        <Section title="Request body parameters">
          <Tabs
            value={value.parameter_mode}
            onValueChange={(parameter_mode) =>
              onChange({ ...value, parameter_mode: parameter_mode as "form" | "json" })
            }
          >
            <TabsList>
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON schema</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="pt-4">
              <ParameterEditor
                value={value.parameter_fields}
                onChange={(parameter_fields) => onChange({ ...value, parameter_fields })}
              />
            </TabsContent>
            <TabsContent value="json" className="pt-4">
              <Field label="JSON schema">
                <Textarea
                  className="min-h-52 font-mono text-xs"
                  value={value.parameters_json}
                  onChange={(event) => onChange({ ...value, parameters_json: event.target.value })}
                />
              </Field>
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <CheckRow
              label="Payload: args only"
              description="Send arguments at the top level without the call wrapper."
              checked={value.args_only}
              onCheckedChange={(args_only) => onChange({ ...value, args_only })}
            />
          </div>
        </Section>
      )}

      <Section title="Store response fields as variables">
        <KeyValueEditor
          value={value.response_variables}
          onChange={(response_variables) => onChange({ ...value, response_variables })}
          keyPlaceholder="data.customer.name"
          valuePlaceholder="customer_name"
        />
      </Section>

      <Section title="Conversation behavior">
        <div className="space-y-4">
          <CheckRow
            label="Talk while waiting"
            description="Say something while the API request is running."
            checked={value.speak_during_execution.enabled}
            onCheckedChange={(enabled) =>
              onChange({
                ...value,
                speak_during_execution: { ...value.speak_during_execution, enabled },
              })
            }
          />
          {value.speak_during_execution.enabled && (
            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[10rem_1fr]">
              <Field label="Message type">
                <Select
                  value={value.speak_during_execution.type}
                  onValueChange={(type) =>
                    onChange({
                      ...value,
                      speak_during_execution: {
                        ...value.speak_during_execution,
                        type: type as "prompt" | "static",
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prompt">Prompt</SelectItem>
                    <SelectItem value="static">Static sentence</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Message">
                <Textarea
                  value={value.speak_during_execution.text}
                  onChange={(event) =>
                    onChange({
                      ...value,
                      speak_during_execution: {
                        ...value.speak_during_execution,
                        text: event.target.value,
                      },
                    })
                  }
                  placeholder="Let me look that up for you."
                />
              </Field>
            </div>
          )}
          <CheckRow
            label="Talk after action completed"
            description="Continue speaking immediately after the function returns."
            checked={value.speak_after_execution}
            onCheckedChange={(speak_after_execution) => onChange({ ...value, speak_after_execution })}
          />
          <Field label="Maximum retries">
            <Select
              value={String(value.max_retry)}
              onValueChange={(retry) => onChange({ ...value, max_retry: Number(retry) })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5].map((retry) => (
                  <SelectItem key={retry} value={String(retry)}>{retry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>
    </>
  )
}

function ParameterEditor({
  value,
  onChange,
}: {
  value: FunctionParameter[]
  onChange: (value: FunctionParameter[]) => void
}) {
  return (
    <div className="space-y-3">
      {value.map((parameter, index) => (
        <div key={index} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_9rem_auto]">
          <Input
            value={parameter.name}
            onChange={(event) =>
              onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))
            }
            placeholder="Parameter name"
          />
          <Select
            value={parameter.type}
            onValueChange={(type) =>
              onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, type: type as FunctionParameter["type"] } : item))
            }
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["string", "number", "boolean", "object", "array"] as const).map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove parameter"
            onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Trash2Icon />
          </Button>
          <Input
            className="sm:col-span-2"
            value={parameter.description}
            onChange={(event) =>
              onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))
            }
            placeholder="What value should the agent provide?"
          />
          <CheckRow
            label="Required"
            checked={parameter.required}
            onCheckedChange={(required) =>
              onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, required } : item))
            }
          />
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...value, { name: "", type: "string", description: "", required: false }])}
      >
        <PlusIcon data-icon="inline-start" />
        Add parameter
      </Button>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  )
}

export function CheckRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Label className="items-start rounded-lg border p-3 leading-normal font-normal">
      <Checkbox
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(Boolean(next))}
        className="mt-0.5"
      />
      <span>
        <span className="block font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </Label>
  )
}
