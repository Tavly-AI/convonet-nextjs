"use client"

import {
  BookTextIcon,
  ClipboardIcon,
  DownloadIcon,
  FileTextIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

import {
  deleteKnowledgeBaseSourceTable,
  deleteKnowledgeBaseTable,
} from "../_lib/knowledge-base-actions"
import type { KnowledgeBaseItem } from "../_lib/knowledge-base-data"
import { UploadDataModal } from "./upload-data-modal"

export function RightDisplay({ knowledgeBase }: { knowledgeBase: KnowledgeBaseItem | null }) {
  if (!knowledgeBase) {
    return (
      <Card className="gap-5 p-5">
        <CardHeader className="px-0">
          <CardTitle className="text-xl">Knowledge Base</CardTitle>
          <CardDescription>
            Add a knowledge base to manage uploaded documents for your agents.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="gap-5 p-5">
      <CardHeader className="items-center px-0 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            {knowledgeBase.name}
          </CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-1">
            ID: {shortenId(knowledgeBase.id)}
            <ClipboardIcon className="size-3.5" />
            <span>• Created on: {formatUploadedAt(knowledgeBase.createdAt)}</span>
          </CardDescription>
        </div>

        <CardAction className="flex items-center gap-2">
          <UploadDataModal
            existingKnowledgeBaseId={knowledgeBase.id}
            existingKnowledgeBaseName={knowledgeBase.name}
            triggerLabel="Upload"
          />
          <DeleteKnowledgeBase knowledgeBase={knowledgeBase} />
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-4 px-0">
        {knowledgeBase.documents.length ? (
          knowledgeBase.documents.map((document) => {
            const status = getStatus(document.status)
            return (
              <Card key={document.id} size="sm" className="gap-3 border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <FileTextIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{document.name}</p>
                        <Badge
                          variant={status.variant}
                          className="shrink-0"
                        >
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground uppercase">
                        {document.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Button variant="ghost" size="icon-lg" aria-label={`Download ${document.name}`}>
                      <DownloadIcon className="size-4" />
                    </Button>
                    <DeleteKnowledgeBaseFile
                      knowledgeBaseId={knowledgeBase.id}
                      documentId={document.id}
                      documentName={document.name}
                    />
                  </div>
                </div>
              </Card>
            )
          })
        ) : (
          <Card size="sm" className="gap-3 border border-dashed p-6">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <BookTextIcon className="size-5 text-muted-foreground" />
              <p className="font-medium">No documents yet</p>
              <p className="text-sm text-muted-foreground">
                Upload documents to make this knowledge base available to your agents.
              </p>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

// MISC CODE

function shortenId(value: string) {
  const suffix = value.slice(-3)
  return `know...${suffix}`
}

function formatUploadedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value))
}

function getStatus(status: string | null) {
  switch (status) {
    case "COMPLETE":
      return { label: "Complete", variant: "default" as const }

    case "FAILED":
      return { label: "Failed", variant: "destructive" as const }

    case "STARTING":
      return { label: "Starting", variant: "secondary" as const }

    default:
      return { label: "Unknown", variant: "outline" as const }
  }
}


// DETELE FILES AND KB LOGIC

function DeleteKnowledgeBase({ knowledgeBase }: { knowledgeBase: KnowledgeBaseItem }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteKnowledgeBase() {
    try {
      setIsDeleting(true)
      await deleteKnowledgeBaseTable(knowledgeBase.id)
      setOpen(false)
      toast.success("Knowledge base deleted.")
      router.replace("/dashboard/knowledge-base")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the knowledge base.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-lg" aria-label="Delete knowledge base" />}
      >
        <Trash2Icon className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md p-0" showCloseButton={!isDeleting}>
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Delete knowledge base?</DialogTitle>
          <DialogDescription>
            This will permanently delete “{knowledgeBase.name}” and all of its files.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t px-6 py-4 sm:justify-end">
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" disabled={isDeleting} onClick={() => void deleteKnowledgeBase()}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteKnowledgeBaseFile({
  knowledgeBaseId,
  documentId,
  documentName,
}: {
  knowledgeBaseId: string
  documentId: string
  documentName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function deleteKnowledgeBaseFile() {
    try {
      setIsDeleting(true)
      await deleteKnowledgeBaseSourceTable({ knowledgeBaseId, sourceId: documentId })
      setOpen(false)
      toast.success("File deleted.")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the file.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-lg" aria-label={`Delete ${documentName}`} />}
      >
        <Trash2Icon className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md p-0" showCloseButton={!isDeleting}>
        <DialogHeader className="border-b px-6 py-5">
          <DialogTitle>Delete file?</DialogTitle>
          <DialogDescription>
            This will permanently delete “{documentName}”.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-t px-6 py-4 sm:justify-end">
          <DialogClose render={<Button variant="outline" disabled={isDeleting} />}>
            Cancel
          </DialogClose>
          <Button variant="destructive" disabled={isDeleting} onClick={() => void deleteKnowledgeBaseFile()}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
