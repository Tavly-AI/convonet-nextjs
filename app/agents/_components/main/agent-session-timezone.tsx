"use client"

import * as React from "react"
import { CheckIcon, Clock3Icon } from "lucide-react"

import { getTimezone, writeTimezone } from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover"

const TIMEZONES = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Toronto",
    "Europe/London",
    "Europe/Paris",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
    "UTC",
]

export function TimezoneSelect() {
    const [timezone, setTimezone] = React.useState(getTimezone)
    const [open, setOpen] = React.useState(false)

    function changeTimezone(value: string) {
        setTimezone(value)
        writeTimezone(value)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger render={<Button type="button" variant="outline" className="h-9" />}>
                <Clock3Icon className="size-4 text-muted-foreground" />
            </PopoverTrigger>

            <PopoverContent align="end" className="w-64 p-0">
                <PopoverHeader className="border-b px-4 py-3">
                    <PopoverTitle>Timezone</PopoverTitle>
                    <PopoverDescription>Use this timezone for your agent.</PopoverDescription>
                </PopoverHeader>
                <div className="max-h-72 overflow-y-auto p-1.5">
                    {TIMEZONES.map(zone => (
                        <Button
                            key={zone}
                            type="button"
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() => changeTimezone(zone)}
                        >
                            {zone}
                            {zone === timezone ? <CheckIcon className="size-4" /> : null}
                        </Button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
