"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

type OptionGridOption<TValue extends string> = {
  value: TValue
  label: string
  description: string
}

export function OptionGrid<TValue extends string>({
  options,
  values,
  onToggle,
}: {
  options: OptionGridOption<TValue>[]
  values: TValue[]
  onToggle: (value: TValue, checked: boolean) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      {options.map((option, index) => {
        const checked = values.includes(option.value)

        return (
          <React.Fragment key={option.value}>
            <button
              type="button"
              onClick={() => onToggle(option.value, !checked)}
              className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={checked}
                tabIndex={-1}
                className="pointer-events-none mt-0.5"
              />
              <div className="grid flex-1 gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </button>
            {index < options.length - 1 && <Separator />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export function CheckRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/50"
    >
      <Checkbox checked={checked} tabIndex={-1} className="pointer-events-none mt-0.5" />
      <div className="grid flex-1 gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
    </button>
  )
}
