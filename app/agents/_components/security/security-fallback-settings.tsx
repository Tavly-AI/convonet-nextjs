"use client"

import * as React from "react"

import type {
    DataStorageSetting,
    GuardrailInputTopic,
    GuardrailOutputTopic,
    PiiCategory,
    SecurityFallbackSettings as SecurityFallbackSettingsConfig,
} from "@/app/agents/_lib/session-storage/agent-session"
import {
    DEFAULT_SECURITY_FALLBACK_SETTINGS,
    getSecurityFallbackSettings,
    writeSecurityFallbackSettings,
} from "@/app/agents/_lib/session-storage/agent-session"
import { CheckRow, OptionGrid } from "@/app/agents/_components/shared/option-grid"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Field } from "../functions/general-tool-form"
import { Section } from "../speech-settings/speech-settings"

const DATA_STORAGE_OPTIONS: { value: DataStorageSetting; label: string; description: string }[] = [
    {
        value: "everything",
        label: "Everything",
        description: "Store transcripts, recordings, logs, and call data.",
    },
    {
        value: "everything_except_pii",
        label: "Everything except PII",
        description: "Store call data while excluding detected personal information.",
    },
    {
        value: "basic_attributes_only",
        label: "Basic attributes only",
        description: "Store metadata only; no transcripts, recordings, or logs.",
    },
]

const PII_CATEGORIES: { value: PiiCategory; label: string; description: string }[] = [
    { value: "person_name", label: "Person Name", description: "Names of callers or contacts." },
    { value: "address", label: "Address", description: "Street, mailing, and location addresses." },
    { value: "email", label: "Email", description: "Email addresses in transcripts or recordings." },
    { value: "phone_number", label: "Phone Number", description: "Phone and contact numbers." },
    { value: "ssn", label: "SSN", description: "Social Security numbers." },
    { value: "passport", label: "Passport", description: "Passport numbers and related IDs." },
    { value: "driver_license", label: "Driver License", description: "Driver license numbers." },
    { value: "credit_card", label: "Credit Card", description: "Payment card numbers." },
    { value: "bank_account", label: "Bank Account", description: "Banking account identifiers." },
    { value: "password", label: "Password", description: "Passwords and secret phrases." },
    { value: "pin", label: "PIN", description: "Security PINs and access codes." },
    { value: "medical_id", label: "Medical ID", description: "Medical record identifiers." },
    { value: "date_of_birth", label: "Date of Birth", description: "Birth dates." },
    {
        value: "customer_account_number",
        label: "Customer Account Number",
        description: "Account IDs assigned to customers.",
    },
]

const OUTPUT_TOPICS: { value: GuardrailOutputTopic; label: string; description: string }[] = [
    { value: "harassment", label: "Harassment", description: "Harassing or abusive language." },
    { value: "self_harm", label: "Self Harm", description: "Content related to self-harm." },
    {
        value: "sexual_exploitation",
        label: "Sexual Exploitation",
        description: "Sexually exploitative content.",
    },
    { value: "violence", label: "Violence", description: "Violent content." },
    {
        value: "defense_and_national_security",
        label: "Defense & National Security",
        description: "Defense and national security topics.",
    },
    {
        value: "illicit_and_harmful_activity",
        label: "Illicit & Harmful Activity",
        description: "Illegal or harmful activities.",
    },
    { value: "gambling", label: "Gambling", description: "Gambling-related content." },
    {
        value: "regulated_professional_advice",
        label: "Regulated Professional Advice",
        description: "Legal, medical, or financial advice.",
    },
    {
        value: "child_safety_and_exploitation",
        label: "Child Safety & Exploitation",
        description: "Child safety and exploitation content.",
    },
]

const INPUT_TOPICS: { value: GuardrailInputTopic; label: string; description: string }[] = [
    {
        value: "platform_integrity_jailbreaking",
        label: "Platform Integrity Jailbreaking",
        description: "Attempts to jailbreak or manipulate the agent.",
    },
]

export function SecurityFallbackSettings() {
    const [settings, setSettings] = React.useState<SecurityFallbackSettingsConfig>(() => {
        const storedSettings = getSecurityFallbackSettings()

        return {
            ...DEFAULT_SECURITY_FALLBACK_SETTINGS,
            ...storedSettings,
            pii_config: {
                ...DEFAULT_SECURITY_FALLBACK_SETTINGS.pii_config,
                ...storedSettings.pii_config,
                mode: "post_call",
                categories: Array.isArray(storedSettings.pii_config?.categories)
                    ? storedSettings.pii_config.categories as PiiCategory[]
                    : DEFAULT_SECURITY_FALLBACK_SETTINGS.pii_config.categories,
            },
            guardrail_config: {
                ...DEFAULT_SECURITY_FALLBACK_SETTINGS.guardrail_config,
                ...storedSettings.guardrail_config,
                output_topics: Array.isArray(storedSettings.guardrail_config?.output_topics)
                    ? storedSettings.guardrail_config.output_topics as GuardrailOutputTopic[]
                    : DEFAULT_SECURITY_FALLBACK_SETTINGS.guardrail_config.output_topics,
                input_topics: Array.isArray(storedSettings.guardrail_config?.input_topics)
                    ? storedSettings.guardrail_config.input_topics as GuardrailInputTopic[]
                    : DEFAULT_SECURITY_FALLBACK_SETTINGS.guardrail_config.input_topics,
            },
        }
    })

    function updateSettings(patch: Partial<SecurityFallbackSettingsConfig>) {
        const nextSettings = { ...settings, ...patch }

        setSettings(nextSettings)
        writeSecurityFallbackSettings(patch)
    }

    function togglePiiCategory(category: PiiCategory, checked: boolean) {
        updateSettings({
            pii_config: {
                mode: "post_call",
                categories: toggleValue(settings.pii_config.categories, category, checked),
            },
        })
    }

    function toggleOutputTopic(topic: GuardrailOutputTopic, checked: boolean) {
        updateSettings({
            guardrail_config: {
                ...settings.guardrail_config,
                output_topics: toggleValue(settings.guardrail_config.output_topics, topic, checked),
            },
        })
    }

    function toggleInputTopic(topic: GuardrailInputTopic, checked: boolean) {
        updateSettings({
            guardrail_config: {
                ...settings.guardrail_config,
                input_topics: toggleValue(settings.guardrail_config.input_topics, topic, checked),
            },
        })
    }

    return (
        <div className="space-y-8 border-t px-5 py-6 bg-gray-400/10 rounded-3xl">
            <Section
                title="Data Storage Settings"
                description="Control how Retell stores transcripts, recordings, logs, and call data."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Storage mode">
                        <Select
                            value={settings.data_storage_setting}
                            onValueChange={(data_storage_setting) =>
                                updateSettings({
                                    data_storage_setting: data_storage_setting as DataStorageSetting,
                                })
                            }
                        >
                            <SelectTrigger className="w-full bg-background">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="min-w-[280px]">
                                {DATA_STORAGE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Retention days">
                        <Input
                            type="number"
                            min={1}
                            max={730}
                            value={settings.data_storage_retention_days ?? ""}
                            onChange={(event) =>
                                updateSettings({
                                    data_storage_retention_days: event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                })
                            }
                            placeholder="Forever"
                            className="bg-background"
                        />
                    </Field>
                </div>
            </Section>

            <Section
                title="Opt In Secure URLs"
                description="Require signed URLs for public logs and recordings."
            >
                <CheckRow
                    label="Use signed URLs"
                    description="Generated URLs include security signatures and expire automatically."
                    checked={settings.opt_in_signed_url}
                    onCheckedChange={(opt_in_signed_url) =>
                        updateSettings({
                            opt_in_signed_url,
                            signed_url_expiration_ms: opt_in_signed_url
                                ? settings.signed_url_expiration_ms ?? 86400000
                                : settings.signed_url_expiration_ms,
                        })
                    }
                />

                {settings.opt_in_signed_url && (
                    <div className="mt-4 max-w-xs">
                        <Field label="Expiration hours">
                            <Input
                                type="number"
                                min={1}
                                value={Math.round((settings.signed_url_expiration_ms ?? 86400000) / 3600000)}
                                onChange={(event) =>
                                    updateSettings({
                                        signed_url_expiration_ms: Number(event.target.value || 24) * 3600000,
                                    })
                                }
                                className="bg-background"
                            />
                        </Field>
                    </div>
                )}
            </Section>

            <Section
                title="Personal Info Redaction (PII)"
                description="Scrub selected personal information from transcripts and recordings after the call."
            >
                <OptionGrid
                    options={PII_CATEGORIES}
                    values={settings.pii_config.categories}
                    onToggle={togglePiiCategory}
                />
            </Section>

            <Section
                title="Safety Guardrails"
                description="Detect prohibited topics in agent output and user input."
            >
                <div className="space-y-5">
                    <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground leading-normal">output guardrails</Label>
                        <OptionGrid
                            options={OUTPUT_TOPICS}
                            values={settings.guardrail_config.output_topics}
                            onToggle={toggleOutputTopic}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm text-muted-foreground leading-normal">input guardrail</Label>
                        <OptionGrid
                            options={INPUT_TOPICS}
                            values={settings.guardrail_config.input_topics}
                            onToggle={toggleInputTopic}
                        />
                    </div>
                </div>
            </Section>
        </div>
    )
}

function toggleValue<TValue extends string>(values: TValue[], value: TValue, checked: boolean) {
    if (checked) return values.includes(value) ? values : [...values, value]

    return values.filter((currentValue) => currentValue !== value)
}
