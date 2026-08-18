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
  CustomFunctionTool,
  FunctionParameter,
  GeneralTool,
  TransferCallTool,
  TransferMode,
} from "@/app/agents/_lib/functions/general-tools"
import { Section } from "../speech-settings/speech-settings"
import { COMPANY_NAME } from "@/lib/constants"

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

      {value.type === "transfer_call" && (
        <TransferCallForm value={value} onChange={onChange} />
      )}
      {value.type === "custom" && (
        <CustomFunctionForm value={value} onChange={onChange} />
      )}
    </div>
  )
}

function TransferCallForm({
  value,
  onChange,
}: {
  value: TransferCallTool
  onChange: (value: TransferCallTool) => void
}) {
  const option = value.transfer_option
  const setOption = (patch: Partial<TransferCallTool["transfer_option"]>) =>
    onChange({ ...value, transfer_option: { ...option, ...patch } })

  return (
    <>
      <Section title="Transfer destination">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination type">
            <Select
              value={value.transfer_destination.type}
              onValueChange={(type) =>
                onChange({
                  ...value,
                  transfer_destination: {
                    ...value.transfer_destination,
                    type: type as "predefined" | "dynamic",
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="predefined">Static destination</SelectItem>
                <SelectItem value="dynamic">Dynamic variable</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            label={value.transfer_destination.type === "dynamic" ? "Dynamic variable" : "Phone number or SIP URI"}
          >
            <Input
              value={value.transfer_destination.number}
              onChange={(event) =>
                onChange({
                  ...value,
                  transfer_destination: {
                    ...value.transfer_destination,
                    number: event.target.value,
                  },
                })
              }
              placeholder={value.transfer_destination.type === "dynamic" ? "{{transfer_number}}" : "+14155551234"}
            />
          </Field>
          <Field label="Extension number">
            <Input
              value={value.transfer_destination.extension}
              onChange={(event) =>
                onChange({
                  ...value,
                  transfer_destination: {
                    ...value.transfer_destination,
                    extension: event.target.value,
                  },
                })
              }
              placeholder="123#"
            />
          </Field>
          <CheckRow
            label="Keep raw input"
            description="Skip E.164 number validation."
            checked={value.transfer_destination.ignore_e164_validation}
            onCheckedChange={(checked) =>
              onChange({
                ...value,
                transfer_destination: {
                  ...value.transfer_destination,
                  ignore_e164_validation: checked,
                },
              })
            }
          />
        </div>
      </Section>

      <Section title="Transfer behavior">
        <div className="space-y-4">
          <Field label="Transfer type">
            <Select
              value={option.type}
              onValueChange={(type) => setOption({ type: type as TransferMode })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cold_transfer">Cold transfer</SelectItem>
                <SelectItem value="warm_transfer">Warm transfer</SelectItem>
                <SelectItem value="agentic_warm_transfer">Agentic warm transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Displayed caller ID">
              <Select
                value={option.show_transferee_as_caller ? "user" : "agent"}
                onValueChange={(caller) => setOption({ show_transferee_as_caller: caller === "user" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">${COMPANY_NAME} agent&apos;s number</SelectItem>
                  <SelectItem value="user">User&apos;s number</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <NumberField
              label="Transfer ring duration (ms)"
              value={option.ring_duration_ms}
              onChange={(ring_duration_ms) => setOption({ ring_duration_ms })}
            />
          </div>

          {option.type === "cold_transfer" ? (
            <Field label="SIP transfer method">
              <Select
                value={option.sip_transfer_method}
                onValueChange={(method) => setOption({ sip_transfer_method: method as "invite" | "refer" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invite">SIP INVITE</SelectItem>
                  <SelectItem value="refer">SIP REFER</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <WarmTransferFields value={value} onChange={onChange} />
          )}
        </div>
      </Section>

      <Section title="Custom SIP headers">
        <KeyValueEditor
          value={value.custom_sip_headers}
          onChange={(custom_sip_headers) => onChange({ ...value, custom_sip_headers })}
          keyPlaceholder="X-Department"
          valuePlaceholder="billing"
        />
      </Section>
    </>
  )
}

function WarmTransferFields({
  value,
  onChange,
}: {
  value: TransferCallTool
  onChange: (value: TransferCallTool) => void
}) {
  const option = value.transfer_option
  const setOption = (patch: Partial<TransferCallTool["transfer_option"]>) =>
    onChange({ ...value, transfer_option: { ...option, ...patch } })

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="On-hold audio">
          <Select
            value={option.on_hold_music}
            onValueChange={(music) => setOption({ on_hold_music: music as "ringtone" | "none" })}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ringtone">Ringtone</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <NumberField
          label="Wait for answer (ms)"
          value={option.wait_for_answer_ms}
          onChange={(wait_for_answer_ms) => setOption({ wait_for_answer_ms })}
        />
      </div>

      {option.type === "warm_transfer" ? (
        <>
          <CheckRow
            label="Navigate IVR"
            description="Let the agent navigate an automated phone menu."
            checked={option.navigate_ivr}
            onCheckedChange={(navigate_ivr) => setOption({ navigate_ivr })}
          />
          <CheckRow
            label="Internal queue or hold system"
            description="Wait until a real person starts speaking."
            checked={option.has_internal_queue}
            onCheckedChange={(has_internal_queue) => setOption({ has_internal_queue })}
          />
          <Field label="Whisper debrief message">
            <Textarea
              value={option.whisper_message}
              onChange={(event) => setOption({ whisper_message: event.target.value })}
              placeholder="Private message played to the transfer destination."
            />
          </Field>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transfer agent ID">
            <Input
              value={option.transfer_agent_id}
              onChange={(event) => setOption({ transfer_agent_id: event.target.value })}
              placeholder="agent_..."
            />
          </Field>
          <Field label="Action on timeout">
            <Select
              value={option.action_on_timeout}
              onValueChange={(action) =>
                setOption({ action_on_timeout: action as "cancel_transfer" | "bridge_transfer" })
              }
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cancel_transfer">Cancel transfer</SelectItem>
                <SelectItem value="bridge_transfer">Bridge transfer</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      )}

      <CheckRow
        label="Three-way ringtone"
        description="Play a short tone when the transfer connects."
        checked={option.three_way_ringtone}
        onCheckedChange={(three_way_ringtone) => setOption({ three_way_ringtone })}
      />
      <Field label="Three-way message">
        <Textarea
          value={option.three_way_message}
          onChange={(event) => setOption({ three_way_message: event.target.value })}
          placeholder="Message shared with both sides after connecting."
        />
      </Field>
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
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={0}
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
