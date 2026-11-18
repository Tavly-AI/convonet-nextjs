"use client"

import { useEffect, useId, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ListFilter, Plus, Trash2 } from "lucide-react"
import { WebsiteCustomDropdown } from "@/components/custom/website-custom-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AnalyticsGlobalTypes } from "../_lib/analytics-globla-types"
import { analytics_filter_modal_filter_params } from "../_lib/analytics-dashboard-filter-modal-params"
import { getVoiceAgents } from "@/app/dashboard/phone-numbers/_lib/phone-number-config-actions"

export function AnalyticsDashboardFilterModal() {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const id = useId()
    const saved = analytics_filter_modal_filter_params.read(params.get("filters"))
    const [open, setOpen] = useState(false)
    const { resolveAgentSelection, resetAgentStatus } = useAgentSelection(open)
    const [filters, setFilters] = useState<(AnalyticsGlobalTypes["AnalyticsFilterType"] & { id: string })[]>([])
    const [pending, startTransition] = useTransition()
    const valid = filters.every(analytics_filter_modal_filter_params.isValid)

    function changeOpen(next: boolean) {
        if (next) {
            setFilters(saved.map(row => ({ ...row, id: crypto.randomUUID() })))
            resetAgentStatus()
        }
        setOpen(next)
    }

    function updateFilter(rowId: string, patch: Partial<AnalyticsGlobalTypes["AnalyticsFilterType"]>) {
        setFilters(rows => rows.map(row => row.id === rowId ? { ...row, ...patch } : row))
    }

    function save() {
        if (!valid || pending) return
        const next = analytics_filter_modal_filter_params.write(params.toString(), filters.map(({ field, operator, value }) => ({ field, operator, value })))
        const query = next.toString()
        startTransition(() => router.push(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, { scroll: false }))
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger render={<Button type="button" variant="outline" disabled={pending} />}>
                <ListFilter aria-hidden="true" /> Filter{saved.length > 0 && ` (${saved.length})`}
            </DialogTrigger>
            <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col overflow-hidden p-5 sm:p-6">
                <DialogHeader className="pr-7">
                    <DialogTitle>Filters</DialogTitle>
                    <DialogDescription>Choose which calls to include in your analytics.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 min-h-0 flex-1 overflow-y-auto py-3">
                    <Tabs defaultValue="base">
                        <TabsList aria-label="Filter categories" className="h-auto! max-w-full flex-wrap justify-start">
                            <TabsTrigger value="base">Base</TabsTrigger>
                            <TabsTrigger value="extraction" disabled>Post Call Extraction</TabsTrigger>
                            <TabsTrigger value="metadata" disabled>Metadata</TabsTrigger>
                            <TabsTrigger value="variables" disabled>Dynamic Variables</TabsTrigger>
                        </TabsList>
                        <TabsContent value="base" className="space-y-3 pt-3">
                            <p className="text-sm text-muted-foreground">Calls must match all filters. Custom-data categories are coming soon.</p>
                            {filters.length === 0 && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No filters selected.</p>}
                            {filters.map((row, index) => {
                                const field = analytics_filter_modal_filter_params.fields.find(field => field.value === row.field)!
                                const selection = resolveAgentSelection(row)
                                const options = selection?.options ?? field.options
                                const prefix = `${id}-filter-${row.id}`
                                const invalid = row.value !== "" && !analytics_filter_modal_filter_params.isValid(row)
                                return (
                                    <div key={row.id} className="rounded-lg border p-3">
                                        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] [&_[data-slot=select-trigger]]:h-10!">
                                            {(["field", "operator"] as const).map(key => (
                                                <div key={key} className="flex min-w-0 flex-col gap-1.5">
                                                    <label htmlFor={`${prefix}-${key}`} className="text-xs font-medium">{key === "field" ? "Field" : "Condition"}</label>
                                                    <WebsiteCustomDropdown id={`${prefix}-${key}`} value={row[key]} options={key === "field" ? analytics_filter_modal_filter_params.fields : analytics_filter_modal_filter_params.operators(row.field)} label={key === "field" ? "Call fields" : "Conditions"} onValueChange={value => updateFilter(row.id, key === "field" ? { field: value, operator: "eq", value: "" } : { operator: value })} />
                                                </div>
                                            ))}
                                            <div className="flex min-w-0 flex-col gap-1.5">
                                                <label htmlFor={`${prefix}-value`} className="text-xs font-medium">Value</label>
                                                {options ? (
                                                    <WebsiteCustomDropdown id={`${prefix}-value`} value={String(row.value)} options={options} label={field.label} placeholder={selection?.placeholder ?? "Select value"} disabled={!options.length || selection?.disabled} onValueChange={value => updateFilter(row.id, { value: field.kind === "boolean" ? value === "true" : value })} />
                                                ) : (
                                                    <Input id={`${prefix}-value`} className="h-10" type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 0 : undefined} step={field.kind === "number" ? "any" : undefined} value={String(row.value)} aria-invalid={invalid} aria-describedby={invalid ? `${prefix}-error` : undefined} placeholder={field.label} onChange={event => updateFilter(row.id, { value: field.kind === "number" && event.target.value !== "" ? event.target.valueAsNumber : event.target.value })} />
                                                )}
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" aria-label={`Remove filter ${index + 1}`} onClick={() => setFilters(rows => rows.filter(item => item.id !== row.id))}><Trash2 aria-hidden="true" /></Button>
                                        </div>
                                        {invalid && <p id={`${prefix}-error`} className="mt-2 text-xs text-destructive">Enter {field.kind === "number" ? "a finite, non-negative number" : "a valid value"}.</p>}
                                    </div>
                                )
                            })}
                            <Button type="button" variant="outline" onClick={() => setFilters(rows => [...rows, { id: crypto.randomUUID(), field: "agent_id", operator: "eq", value: "" }])}><Plus aria-hidden="true" /> Add filter</Button>
                        </TabsContent>
                    </Tabs>
                </div>
                <DialogFooter className="mt-4 border-t pt-4">
                    <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => setFilters([])}>Clear all</Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="button" disabled={!valid || pending} onClick={save}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function useAgentSelection(open: boolean) {
    const [agents, setAgents] = useState<Awaited<ReturnType<typeof getVoiceAgents>>>([])
    const [agentStatus, setAgentStatus] = useState("Loading agents…")

    useEffect(() => {
        if (!open) return
        let active = true
        getVoiceAgents().then(agents => {
            if (!active) return
            setAgents(agents)
            setAgentStatus("")
        }).catch(() => {
            if (active) setAgentStatus("Could not load agents. Reopen to retry.")
        })
        return () => { active = false }
    }, [open])

    function resolveAgentSelection(row: AnalyticsGlobalTypes["AnalyticsFilterType"]) {
        if (row.field !== "agent_id" || row.operator === "contains") return null
        const options = agents.map(agent => ({ value: agent.id, label: agent.name, description: agent.id }))
        if (row.value && !options.some(option => option.value === row.value)) {
            options.push({ value: String(row.value), label: agentStatus ? String(row.value) : `${row.value} (unavailable)`, description: String(row.value) })
        }
        return {
            options,
            placeholder: agentStatus || (agents.length ? "Select agent" : "No agents available"),
            disabled: !!agentStatus,
        }
    }

    return { resolveAgentSelection, resetAgentStatus: () => setAgentStatus("Loading agents…") }
}
