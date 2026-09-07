"use client"

import { ChevronDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const countries = [
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
    { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
    { code: "IN", name: "India", flag: "🇮🇳" },
    { code: "SG", name: "Singapore", flag: "🇸🇬" },
    { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
    { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
    { code: "ZA", name: "South Africa", flag: "🇿🇦" },
    { code: "NG", name: "Nigeria", flag: "🇳🇬" },
    { code: "KE", name: "Kenya", flag: "🇰🇪" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "FR", name: "France", flag: "🇫🇷" },
    { code: "ES", name: "Spain", flag: "🇪🇸" },
    { code: "IT", name: "Italy", flag: "🇮🇹" },
    { code: "NL", name: "Netherlands", flag: "🇳🇱" },
    { code: "BE", name: "Belgium", flag: "🇧🇪" },
    { code: "SE", name: "Sweden", flag: "🇸🇪" },
    { code: "NO", name: "Norway", flag: "🇳🇴" },
    { code: "DK", name: "Denmark", flag: "🇩🇰" },
    { code: "IE", name: "Ireland", flag: "🇮🇪" },
    { code: "CH", name: "Switzerland", flag: "🇨🇭" },
    { code: "AT", name: "Austria", flag: "🇦🇹" },
    { code: "BR", name: "Brazil", flag: "🇧🇷" },
    { code: "MX", name: "Mexico", flag: "🇲🇽" },
    { code: "AR", name: "Argentina", flag: "🇦🇷" },
    { code: "CL", name: "Chile", flag: "🇨🇱" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "KR", name: "South Korea", flag: "🇰🇷" },
]

export function CountriesDropdown({ value, onChange, }: { value: string; onChange: (value: string) => void }) {
    const selectedCodes = Array.from(
        new Set(value
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean)
        )
    )

    const selectedCountries = countries.filter((country) =>
        selectedCodes.includes(country.code)
    )

    let label = "Select countries"

    if (selectedCountries.length === 1) {
        label = `${selectedCountries[0].flag} ${selectedCountries[0].code}`
    } else if (selectedCountries.length > 1) {
        label = `${selectedCountries[0].flag} ${selectedCountries[0].code} +${selectedCountries.length - 1}`
    } else if (selectedCodes.length > 0) {
        label = selectedCodes.join(", ")
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-between px-3 font-normal"
                    />
                }
            >
                <span className="truncate text-left">{label}</span>
                <ChevronDownIcon className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-80 w-[var(--anchor-width)]">
                {countries.map((country) => (
                    <DropdownMenuCheckboxItem
                        key={country.code}
                        checked={selectedCodes.includes(country.code)}
                        onCheckedChange={(checked) =>
                            onChange(
                                (checked
                                    ? [...selectedCodes, country.code]
                                    : selectedCodes.filter((code) => code !== country.code)
                                ).join(", ")
                            )
                        }
                    >
                        <span className="flex items-center gap-2">
                            <span aria-hidden="true">{country.flag}</span>
                            <span>{country.name}</span>
                            <span className="text-muted-foreground">{country.code}</span>
                        </span>
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
