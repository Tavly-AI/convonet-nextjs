"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  BotIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  SearchIcon,
} from "lucide-react"
import { createAgent as createAgentAction } from "@/app/agents/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type AgentListItem = {
  id: string
  name: string
  type: string
  voice: { name: string; avatarUrl: string } | null
  phone: string
  updatedAt: string
}

const pageSize = 10

export function AgentsList({ agents }: { agents: AgentListItem[] }) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(query.toLowerCase())
  )
  const pageCount = Math.max(1, Math.ceil(filteredAgents.length / pageSize))
  const visibleAgents = filteredAgents.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  const router = useRouter()
  const [isCreating, startCreating] = useTransition()

  function createAgent() {
    startCreating(async () => {
      try {
        const agent = await createAgentAction({
          name: "Untitled Agent",
          config: {},
          llmConfig: {},
        })

        router.push(`/agents?agentId=${encodeURIComponent(agent.id)}`)
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create agent."
        )
      }
    })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">All Agents</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage the agents in your workspace.
          </p>
        </div>
        <div className="flex flex-1 items-center gap-2 md:ml-auto md:max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              className="pl-8"
              placeholder="Search agents..."
              aria-label="Search agents"
            />
          </div>
          <Button type="button" disabled={isCreating} onClick={createAgent}>
            {isCreating ? "Creating..." : "Create an Agent"}
          </Button>
        </div>
      </div>

      <div className="min-h-0 overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 pl-4">Agent Name</TableHead>
              <TableHead>Agent Type</TableHead>
              <TableHead>Voice</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Last edited</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleAgents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell className="h-14 pl-4 font-medium">
                  <div className="flex max-w-64 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <BotIcon className="size-4" />
                    </span>
                    <span className="truncate">{agent.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{agent.type}</Badge>
                </TableCell>
                <TableCell>
                  {agent.voice ? (
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage
                          src={agent.voice.avatarUrl}
                          alt={agent.voice.name}
                        />
                        <AvatarFallback>{agent.voice.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{agent.voice.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell className="text-muted-foreground">
                  {agent.updatedAt}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${agent.name}`} />
                      }
                    >
                      <EllipsisVerticalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <Link href={`/agents?agentId=${encodeURIComponent(agent.id)}`} />
                        }
                      >
                        Open in builder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {!visibleAgents.length && (
              <TableRow>
                <TableCell colSpan={6} className="h-56 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <BotIcon className="size-5" />
                    </span>
                    <p className="font-medium">
                      {query ? "No agents found" : "No agents yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {query
                        ? "Try a different search term."
                        : "Create your first agent to see it here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredAgents.length > pageSize && (
        <div className="mt-auto flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </Button>
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm">
            {page}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={page === pageCount}
            onClick={() => setPage((current) => current + 1)}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </section>
  )
}
