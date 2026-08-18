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
  const inputKey = React.useMemo(
    () =>
      options
        .map((option) => `${option.value}:${option.label}:${option.description}`)
        .join("|"),
    [options]
  )
  const [expandedState, setExpandedState] = React.useState(() => ({
    key: inputKey,
    expanded: false,
  }))
  const expanded = expandedState.key === inputKey ? expandedState.expanded : false
  const visibleOptions = expanded ? options : []

  return (
    <div key={inputKey} className="overflow-hidden rounded-lg border bg-background">
      {visibleOptions.map((option, index) => {
        const checked = values.includes(option.value)
        const showSeparator = index < visibleOptions.length - 1

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
            {showSeparator && <Separator />}
          </React.Fragment>
        )
      })}
      {expanded && options.length > 0 && <Separator />}
      {options.length > 0 && (
        <OptionGridToggle
          expanded={expanded}
          onToggle={() =>
            setExpandedState((currentState) => ({
              key: inputKey,
              expanded: currentState.key === inputKey ? !currentState.expanded : true,
            }))
          }
        />
      )}
    </div>
  )
}

function OptionGridToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="flex w-full items-center justify-center px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
    >
      {expanded ? "Show less" : "Show all"}
    </button>
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
