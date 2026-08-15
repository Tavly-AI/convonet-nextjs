"use client"

import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type KeyValue = {
  key: string
  value: string
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  value: KeyValue[]
  onChange: (value: KeyValue[]) => void
  keyPlaceholder: string
  valuePlaceholder: string
}) {
  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            value={item.key}
            onChange={(event) => onChange(value.map((row, rowIndex) =>
              rowIndex === index ? { ...row, key: event.target.value } : row
            ))}
            placeholder={keyPlaceholder}
          />
          <Input
            value={item.value}
            onChange={(event) => onChange(value.map((row, rowIndex) =>
              rowIndex === index ? { ...row, value: event.target.value } : row
            ))}
            placeholder={valuePlaceholder}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove row"
            onClick={() => onChange(value.filter((_, rowIndex) => rowIndex !== index))}
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...value, { key: "", value: "" }])}
      >
        <PlusIcon data-icon="inline-start" />
        Add
      </Button>
    </div>
  )
}
