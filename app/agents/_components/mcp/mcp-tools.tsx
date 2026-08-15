"use client"

import * as React from "react"
import {
  MoreHorizontalIcon,
  PlusIcon,
  ServerIcon,
  Trash2Icon,
} from "lucide-react"

import { KeyValueEditor, type KeyValue } from "@/app/agents/_components/shared/key-value-editor"
import type { McpConfig } from "@/app/agents/_lib/mcp/mcp"
import {
  getMcps,
  writeMcps,
} from "@/app/agents/_lib/session-storage/agent-session"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type McpDraft = Omit<McpConfig, "headers" | "query_params"> & {
  headers: KeyValue[]
  query_params: KeyValue[]
}

const EMPTY_MCP: McpDraft = {
  name: "",
  url: "",
  timeout_ms: 120000,
  headers: [],
  query_params: [],
}

export function McpTools() {
  const [mcps, setMcps] = React.useState(getMcps)
  const [draft, setDraft] = React.useState<McpDraft | null>(null)
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null)
  const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null)

  function updateMcps(nextMcps: McpConfig[]) {
    writeMcps(nextMcps)
    setMcps(nextMcps)
  }

  function openNew() {
    setEditingIndex(null)
    setDraft({ ...EMPTY_MCP, headers: [], query_params: [] })
  }

  function openEdit(index: number) {
    const mcp = mcps[index]
    setEditingIndex(index)
    setDraft({
      ...mcp,
      headers: Object.entries(mcp.headers).map(([key, value]) => ({ key, value })),
      query_params: Object.entries(mcp.query_params).map(([key, value]) => ({ key, value })),
    })
  }

  function saveMcp() {
    if (!draft) return

    const nextMcp: McpConfig = {
      name: draft.name.trim(),
      url: draft.url.trim(),
      timeout_ms: draft.timeout_ms,
      headers: Object.fromEntries(draft.headers.filter(({ key }) => key).map(({ key, value }) => [key, value])),
      query_params: Object.fromEntries(draft.query_params.filter(({ key }) => key).map(({ key, value }) => [key, value])),
    }
    const nextMcps = editingIndex === null
      ? [...mcps, nextMcp]
      : mcps.map((mcp, index) => index === editingIndex ? nextMcp : mcp)

    updateMcps(nextMcps)
    setDraft(null)
  }

  return (
    <div className="space-y-3 border-t px-1 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Connect MCP servers that this agent can use.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={openNew}>
          <PlusIcon data-icon="inline-start" />
          Add MCP
        </Button>
      </div>

      {mcps.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No MCP servers added yet.
        </div>
      ) : (
        <div className="space-y-2">
          {mcps.map((mcp, index) => (
            <button
              key={`${mcp.name}-${index}`}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50"
              onClick={() => openEdit(index)}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ServerIcon className="size-4 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{mcp.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {mcp.url}
                </span>
              </span>
              <MoreHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="flex max-h-[92svh] max-w-2xl flex-col overflow-hidden p-0">
          {draft && (
            <form
              className="contents"
              onSubmit={(event) => {
                event.preventDefault()
                saveMcp()
              }}
            >
              <DialogHeader className="shrink-0 border-b px-6 py-5">
                <DialogTitle>{editingIndex === null ? "Add MCP" : "Edit MCP"}</DialogTitle>
                <DialogDescription>
                  Configure the remote MCP server connection used by Retell.
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" htmlFor="mcp-name">
                    <Input
                      id="mcp-name"
                      value={draft.name}
                      placeholder="Customer database"
                      required
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  </Field>
                  <Field label="Timeout (ms)" htmlFor="mcp-timeout">
                    <Input
                      id="mcp-timeout"
                      type="number"
                      min={1}
                      value={draft.timeout_ms}
                      required
                      onChange={(event) => setDraft({ ...draft, timeout_ms: Number(event.target.value) })}
                    />
                  </Field>
                </div>

                <Field label="Server URL" htmlFor="mcp-url">
                  <Input
                    id="mcp-url"
                    type="url"
                    value={draft.url}
                    placeholder="https://mcp.example.com/mcp"
                    required
                    onChange={(event) => setDraft({ ...draft, url: event.target.value })}
                  />
                </Field>

                <Section title="Headers">
                  <KeyValueEditor
                    keyPlaceholder="Authorization"
                    valuePlaceholder="Bearer {{api_key}}"
                    value={draft.headers}
                    onChange={(headers) => setDraft({ ...draft, headers })}
                  />
                </Section>
                <Section title="Query parameters">
                  <KeyValueEditor
                    keyPlaceholder="tenant"
                    valuePlaceholder="{{tenant_id}}"
                    value={draft.query_params}
                    onChange={(query_params) => setDraft({ ...draft, query_params })}
                  />
                </Section>
              </div>

              <DialogFooter className="shrink-0 border-t px-6 py-4">
                {editingIndex !== null && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="sm:mr-auto"
                    onClick={() => setDeleteIndex(editingIndex)}
                  >
                    <Trash2Icon data-icon="inline-start" />
                    Delete
                  </Button>
                )}
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit">Save MCP</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Delete MCP?</DialogTitle>
            <DialogDescription>
              This removes the MCP server from the current agent configuration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteIndex !== null) {
                  updateMcps(mcps.filter((_, index) => index !== deleteIndex))
                }
                setDeleteIndex(null)
                setDraft(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function Section({ title, children }: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 border-t pt-5">
      <h3 className="font-medium">{title}</h3>
      {children}
    </section>
  )
}
