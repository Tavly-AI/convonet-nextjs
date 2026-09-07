"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BracesIcon, WorkflowIcon } from "lucide-react"
import { toast } from "sonner"

import { createAgent as createAgentAction } from "@/app/agents/actions"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { AGENT_CHANNELS } from "@/lib/constants"
import { CreateAgentButton } from "./create-agent-modal"

export type CreateChatAgentModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateChatAgentModal({ open, onOpenChange }: CreateChatAgentModalProps) {
    const router = useRouter()
    const [agentType, setAgentType] = useState("single_prompt")

    async function createAgent() {
        try {
            const agent = await createAgentAction({ name: "Untitled Agent", channel: AGENT_CHANNELS.CHAT, config: {}, llmConfig: {} })

            const params = new URLSearchParams({ agentId: agent.id, channel: AGENT_CHANNELS.CHAT, agentType })

            router.push(`/agents?${params.toString()}`)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create agent.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-5">
                    <DialogTitle>Create agent</DialogTitle>
                    <DialogDescription className="sr-only">
                        Choose an agent type.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-6">
                    <section className="space-y-4">
                        <h2 className="text-sm font-medium text-muted-foreground">
                            Type
                        </h2>

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
                                        <p className="text-sm font-medium">
                                            Single prompt
                                        </p>
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
                                        <p className="text-sm font-medium">
                                            Conversational flow
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Production-ready, deterministic conversations.
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>

                <DialogFooter className="border-t px-6 py-4">
                    <CreateAgentButton onCreate={createAgent} />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}