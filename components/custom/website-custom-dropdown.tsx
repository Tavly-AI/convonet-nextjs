"use client"

import { UserRoundIcon } from "lucide-react"

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

    return (
        <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue ?? emptyOption?.value ?? "")}>
            <SelectTrigger className="h-10 w-full">
                <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder={placeholder}>{selectedOption?.label ?? placeholder}</SelectValue>
            </SelectTrigger>

            <SelectContent className="max-h-96">
                {emptyOption && (
                    <>
                        <SelectGroup>
                            <SelectLabel>Routing</SelectLabel>
                            <SelectItem value={emptyOption.value} className="py-2">
                                <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                                <span>{emptyOption.label}</span>
                                {emptyOption.description && (
                                    <span className="text-muted-foreground">{emptyOption.description}</span>
                                )}
                            </SelectItem>
                        </SelectGroup>
                        <SelectSeparator />
                    </>
                )}

                <SelectGroup>
                    <SelectLabel>{label}</SelectLabel>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="py-2">
                            <UserRoundIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span>{option.label}</span>
                            {option.description && (
                                <span className="text-muted-foreground">{option.description}</span>
                            )}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
