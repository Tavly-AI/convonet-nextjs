import React from "react"
import { ChevronDownIcon, Settings2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"
import {
    getVoiceMoreSettings,
    VOICE_MODEL_MAP_MORE_SETTINGS,
    writeVoiceMoreSettings,
} from "../../_lib/session-storage/agent-session"
import type { Voice } from "../../_data/voices-updated"

export function VoiceMoreSettings({ provider }: { provider: Voice["provider"] | null }) {
    return (
        <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" />}>
                <Settings2Icon className="size-4" />
                More Settings
                <ChevronDownIcon className="size-3" />
            </PopoverTrigger>

            <PopoverContent align="end" side="top" className="w-80 space-y-3 p-4">
                <VoiceModelSettings provider={provider} />

                <div className="border-t border-dashed" />

                <VoiceSpeedVolumeSettings />
            </PopoverContent>
        </Popover>
    )
}

function VoiceModelSettings({ provider }: { provider: Voice["provider"] | null }) {
    const [settings, setSettings] = React.useState(getVoiceMoreSettings)

    const available_models = Object.entries(VOICE_MODEL_MAP_MORE_SETTINGS)
        .filter(([id]) =>
            provider === "elevenlabs"
                ? id.startsWith("eleven_")
                : provider === "cartesia" && id.startsWith("sonic-")
        )
        .map(([value, label]) => ({ value, label }))

    return (
        <div>
            <div className="mb-3 text-sm font-medium">Voice Model</div>
            <WebsiteCustomDropdown
                value={available_models.find(m => m.value === settings.voice_model)?.value ?? ""}
                onValueChange={value => {
                    if (available_models.some(m => m.value === value)) {
                        setSettings(writeVoiceMoreSettings({ voice_model: value }))
                    }
                }}
                options={available_models}
                label="Voice available_models"
            />
        </div>
    )
}

function VoiceSpeedVolumeSettings() {
    const [settings, setSettings] = React.useState(getVoiceMoreSettings)
    const update = (patch: Parameters<typeof writeVoiceMoreSettings>[0]) => setSettings(writeVoiceMoreSettings(patch))

    return (
        <>
            {([
                { key: "voice_speed", label: "Voice Speed", min: 0.5 },
                { key: "volume", label: "Voice Volume", min: 0 },
            ] as const).map(({ key, label, min }) => (
                <div key={key} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{label}</label>
                        <span className="text-xs text-muted-foreground">
                            {settings[key].toFixed(2)}
                        </span>
                    </div>

                    <Slider
                        value={[settings[key]]}
                        onValueChange={value =>
                            update({ [key]: Array.isArray(value) ? value[0] : value })
                        }
                        min={min}
                        max={2}
                        step={0.05}
                    />
                </div>
            ))}
        </>
    )
}