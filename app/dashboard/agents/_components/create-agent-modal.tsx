"use client"

import { useState } from "react"
import {
  BracesIcon,
  Loader2Icon,
  WorkflowIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { TEMPLATE_TABS, TEMPLATES_LIST } from "../_data/templates-list"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createAgent as createAgentAction, } from "@/app/agents/actions"
import { AGENT_CHANNELS, type AgentChannel } from "@/lib/constants"

export type CreateAgentOptions = {
  channel: AgentChannel
  agentType: string
  template: string
}

export type CreateAgentModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type TemplateCategory = (typeof TEMPLATE_TABS)[number]

export function CreateAgentModal({ open, onOpenChange }: CreateAgentModalProps) {
  const router = useRouter()

  const [agentType, setAgentType] = useState("single_prompt")
  const [selectedTemplate, setSelectedTemplate] = useState("scratch")
  const [activeTemplateTab, setActiveTemplateTab] = useState<TemplateCategory>("All")

  const visibleTemplates = TEMPLATES_LIST.filter((template) => activeTemplateTab === "All" || template.category === activeTemplateTab)

  async function createAgent() {
    try {
      const agent = await createAgentAction({ name: "Untitled Agent", channel: AGENT_CHANNELS.VOICE, config: {}, llmConfig: {} })

      const params = new URLSearchParams({ agentId: agent.id, channel: AGENT_CHANNELS.VOICE, agentType, template: selectedTemplate, })

      router.push(`/agents?${params.toString()}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create agent.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[750px] max-h-[88svh] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>Create agent</DialogTitle>
          <DialogDescription className="sr-only">
            Choose an agent type and template.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-medium text-muted-foreground">
                Type
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setAgentType("single_prompt")}
                className={cn(
                  "rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/40",
                  agentType === "single_prompt" && "border-ring"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white">
                    <BracesIcon className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">Single prompt</p>
                    <p className="text-xs text-muted-foreground">
                      Easy to start. Simple, free-form conversations.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAgentType("conversational_flow")}
                disabled
                className={cn(
                  "rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/40",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background",
                  agentType === "conversational_flow" && "border-ring"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500 text-white">
                    <WorkflowIcon className="size-4" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm  font-medium">Conversational flow</p>
                    <p className="text-xs text-muted-foreground">
                      Production-ready, deterministic conversations.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Templates
            </h2>

            <Tabs
              value={activeTemplateTab}
              onValueChange={(value) =>
                setActiveTemplateTab(value as TemplateCategory)
              }
              className="gap-5"
            >
              <div className="flex items-center gap-2 overflow-hidden border-b">
                <TabsList
                  variant="line"
                  className="h-10 max-w-full justify-start overflow-x-auto"
                >
                  {TEMPLATE_TABS.map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="ml-4 px-0 text-sm">
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "min-h-36 rounded-lg border bg-background p-4 text-left transition-colors hover:bg-muted/40",
                    template.muted && "border-dashed",
                    selectedTemplate === template.id && "border-ring"
                  )}
                >
                  <div className="flex h-full flex-col gap-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-2">
                        {template.icons.map((Icon, index) => (
                          <span
                            key={`${template.id}-${index}`}
                            className={cn(
                              "flex size-7 items-center justify-center rounded-md",
                              index === 0
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
                              template.id === "prompt" &&
                              "bg-indigo-500/15 text-indigo-400",
                              template.id === "scratch" &&
                              "bg-muted text-muted-foreground",
                              template.id === "outreach" &&
                              index === 1 &&
                              "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
                              template.id === "outreach" &&
                              index === 2 &&
                              "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            )}
                          >
                            <Icon className="size-4" />
                          </span>
                        ))}
                      </div>
                      {template.badge && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {template.badge}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto space-y-1.5">
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <CreateAgentButton onCreate={createAgent} />
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}

type CreateAgentButtonProps = {
  onCreate: () => Promise<void>
}

export function CreateAgentButton({ onCreate }: CreateAgentButtonProps) {
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    if (isCreating) return
    setIsCreating(true)

    try {
      await onCreate()
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleCreate}
      disabled={isCreating}
    >
      {isCreating && <Loader2Icon className="mr-2 size-4 animate-spin" />}

      {isCreating ? "Creating..." : "Create agent"}
    </Button>
  )
}