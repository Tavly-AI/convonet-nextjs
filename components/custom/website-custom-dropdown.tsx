"use client"

import { type LucideIcon, UserRoundIcon } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type WebsiteCustomDropdownOption = {
    value: string
    label: string
    description?: string
    icon?: LucideIcon
}

type WebsiteCustomDropdownProps = {
    value: string
    onValueChange: (value: string) => void
    options: WebsiteCustomDropdownOption[]
    placeholder?: string
    emptyOption?: WebsiteCustomDropdownOption
    label?: string
}

export function WebsiteCustomDropdown({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    emptyOption,
    label = "Options",
}: WebsiteCustomDropdownProps) {
    const selectedOption = options.find((option) => option.value === value)
    const SelectedIcon = selectedOption?.icon ?? UserRoundIcon

    return (
        <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue ?? emptyOption?.value ?? "")}>
            <SelectTrigger className="h-10 w-full">
                <SelectedIcon className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder={placeholder}>{selectedOption?.label ?? placeholder}</SelectValue>
            </SelectTrigger>

            <SelectContent className="max-h-96 min-w-80">
                {emptyOption && (
                    <>
                        <SelectGroup>
                            <SelectLabel>Routing</SelectLabel>
                            <DropdownOption option={emptyOption} />
                        </SelectGroup>
                        <SelectSeparator />
                    </>
                )}

                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {options.map((option) => (
                        <DropdownOption key={option.value} option={option} />
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}

function DropdownOption({ option }: { option: WebsiteCustomDropdownOption }) {
    const Icon = option.icon ?? UserRoundIcon

    return (
        <SelectItem value={option.value} className="items-start py-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 whitespace-normal">
                <span className="block">{option.label}</span>
                {option.description && (
                    <span className="block text-muted-foreground">{option.description}</span>
                )}
            </span>
        </SelectItem>
    )
}
