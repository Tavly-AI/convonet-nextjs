"use client"

import type { FormEvent } from "react"
import { useState, useTransition } from "react"
import { UploadCloudIcon } from "lucide-react"
import { toast } from "sonner"

import { publishAgent } from "@/app/agents/actions"
import {
    getAgentSession,
    initializeAgentSession,
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
import { Textarea } from "@/components/ui/textarea"

export function AgentSessionVersion() {
    const [isPublishing, startPublishing] = useTransition()
    const [publishDialogOpen, setPublishDialogOpen] = useState(false)
    const [versionTitle, setVersionTitle] = useState("")
    const [versionDescription, setVersionDescription] = useState("")
    const [draftVersion, setDraftVersion] = useState(getAgentSession()?.draftVersion ?? 0)

    function openPublishDialog() {
        const session = getAgentSession()
        if (!session?.id) {
            toast.error("Agent ID is missing. Create an agent from the dashboard first.")
            return
        }

        setVersionTitle(`v${draftVersion}`)
        setVersionDescription("")
        setPublishDialogOpen(true)
    }

    function handlePublish(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const session = getAgentSession()
        if (!session?.id) {
            toast.error("Agent ID is missing. Create an agent from the dashboard first.")
            return
        }
        if (!versionTitle.trim()) {
            toast.error("Version title is required.")
            return
        }

        startPublishing(async () => {
            try {
                const publishedAgent = await publishAgent(session, {
                    title: versionTitle,
                    description: versionDescription,
                })
                initializeAgentSession(publishedAgent)

                setPublishDialogOpen(false)
                toast.success(`v${draftVersion} published successfully.`)
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to publish agent.")
            }
        })
    }

    return (
        <>
            <div className="flex items-center justify-end gap-3">
                <Button
                    type="button"
                    disabled
                    variant={"outline"}
                >
                    Draft v{draftVersion}
                </Button>

                <Button
                    type="button"
                    disabled={isPublishing}
                    onClick={openPublishDialog}
                >
                    <UploadCloudIcon data-icon="inline-start" />
                    {isPublishing ? "Publishing..." : "Publish"}
                </Button>
            </div>

            <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                <DialogContent className="max-w-md p-0">
                    <form onSubmit={handlePublish}>
                        <DialogHeader className="border-b px-6 py-5">
                            <DialogTitle>Publish v{draftVersion}</DialogTitle>
                            <DialogDescription>
                                Add a title and optional description for this immutable version.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 px-6 py-5">
                            <div className="grid gap-2">
                                <Label htmlFor="version-title">Title</Label>
                                <Input
                                    id="version-title"
                                    value={versionTitle}
                                    onChange={(event) => setVersionTitle(event.target.value)}
                                    placeholder="Launch configuration"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="version-description">Description</Label>
                                <Textarea
                                    id="version-description"
                                    value={versionDescription}
                                    onChange={(event) => setVersionDescription(event.target.value)}
                                    placeholder="What changed in this version?"
                                />
                            </div>
                        </div>

                        <DialogFooter className="border-t px-6 py-4">
                            <DialogClose render={<Button type="button" variant="outline" />}>
                                Cancel
                            </DialogClose>
                            <Button type="submit" disabled={isPublishing}>
                                {isPublishing ? "Publishing..." : "Publish version"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}
