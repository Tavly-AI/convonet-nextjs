"use client"

import { useRef, useState } from "react"
import {
  FileUpIcon,
  LinkIcon,
  PlusIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

import { appendFileS3 } from "../_lib/append-file-s3"
import { startKnowledgeBaseIngestion } from "../_lib/start-kb-ingestion"
import { createKnowledgeBaseTable, updateKnowledgeBaseTable } from "../_lib/knowledge-base-actions"
import { UPLOAD_FILE_ACCEPT, UPLOAD_FILE_TYPES } from "../_lib/upload-file-types"
import { HandleTxtFiles } from "./handle-txt-files"
import { HandleGoogleFiles } from "./handle-google-files"
import { HandleWebPages } from "./handle-web-pages"


type PendingDocument = {
  id: string
  file: File
}

export function UploadDataModal({
  existingKnowledgeBaseId,
  existingKnowledgeBaseName,
  triggerLabel,
}: {
  existingKnowledgeBaseId?: string
  existingKnowledgeBaseName?: string
  triggerLabel?: string // used as there are 2 upload modals
}) {

  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState("")
  const [documents, setDocuments] = useState<PendingDocument[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // existing knowledge base
  const isExistingKnowledgeBase = Boolean(existingKnowledgeBaseId)
  const knowledgeBaseName = isExistingKnowledgeBase ? existingKnowledgeBaseName ?? "" : newKnowledgeBaseName

  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false)
  const [isWebPagesDialogOpen, setIsWebPagesDialogOpen] = useState(false)


  // ==================================================
  // ================ SELECT FILES ====================
  // ==================================================

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])

    if (!files.length) return

    const validFiles = files.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase()
      return extension && UPLOAD_FILE_TYPES.includes(extension as typeof UPLOAD_FILE_TYPES[number])
    })

    if (validFiles.length !== files.length) {
      toast.error("Some files were skipped because their format is not supported.")
    }

    setDocuments((current) => [
      ...current,
      ...validFiles.map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
      })),
    ])

    event.target.value = ""
  }

  // handle txt file
  function handleAddFile(file: File) {
    setDocuments((current) => [
      ...current,
      {
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
      },
    ])
  }

  // handle web pages
  function handleAddFiles(files: File[]) {
    setDocuments((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        file,
      })),
    ])
  }

  async function handleSave() {

    // ==================================================
    // ================ EARLY RETURN ====================
    // ==================================================

    if (!knowledgeBaseName.trim()) return
    if (!documents.length) {
      toast.error("Add at least one document.")
      return
    }

    try {
      setIsSaving(true)


      // ==================================================
      // ================ UPLOD TO S3 =====================
      // ==================================================

      const uploadedFiles = await Promise.all(documents.map((document) => appendFileS3(document.file)))


      // ==================================================
      // ============== START INGESTION ===================
      // ==================================================

      const ingestion = await startKnowledgeBaseIngestion()


      // ==================================================
      // ================= UPDATE DB ======================
      // ==================================================

      const files = uploadedFiles.map((file) => ({
        filename: file.filename,
        fileUrl: file.url,
        fileSize: file.size,
        type: "document",
        ingestionJobId: ingestion.ingestionJobId ?? null,
        status: ingestion.status ?? null,
      }))

      if (existingKnowledgeBaseId) {
        await updateKnowledgeBaseTable({
          knowledgeBaseId: existingKnowledgeBaseId,
          files,
        })
      } else {
        await createKnowledgeBaseTable({
          knowledgeBaseName,
          files,
        })
      }

      toast.success(isExistingKnowledgeBase ? "Files added to knowledge base." : "Knowledge base uploaded.")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload knowledge base.")
    } finally {
      setIsSaving(false)
    }
  }

  const isSaveDisabled = !knowledgeBaseName.trim() || documents.length === 0

  // reset modal on save
  // reset modal on open
  function resetModal() {
    setNewKnowledgeBaseName("")
    setDocuments([])
    setIsTextDialogOpen(false)
    setIsWebPagesDialogOpen(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetModal()
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            size={triggerLabel ? "default" : "icon-lg"}
            variant={triggerLabel ? "outline" : "default"}
            aria-label={
              isExistingKnowledgeBase ? "Add files to knowledge base" : "Add knowledge base"
            }
          />
        }
      >
        <PlusIcon className="size-5" />
        {triggerLabel ? triggerLabel : null}
      </DialogTrigger>

      <DialogContent className={`max-h-[90vh] max-w-5xl p-0 transition-all ${isTextDialogOpen || isWebPagesDialogOpen ? "blur-sm" : ""}`}>
        <div className="max-h-[90vh] space-y-6 overflow-y-auto p-6">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={UPLOAD_FILE_ACCEPT}
            className="hidden"
            onChange={handleFileSelect}
          />

          <DialogHeader className="pr-10">
            <DialogTitle>
              {isExistingKnowledgeBase ? "Add Files" : "Add Knowledge Base"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <label
              htmlFor="knowledge-base-name"
              className="text-sm font-medium"
            >
              Knowledge Base Name
            </label>
            <Input
              id="knowledge-base-name"
              value={knowledgeBaseName}
              onChange={(event) => setNewKnowledgeBaseName(event.target.value)}
              placeholder="Enter"
              className="h-10"
              readOnly={isExistingKnowledgeBase}
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Documents</p>

            {documents.length > 0 && (
              <div className="space-y-3">
                {documents.map((document) => (
                  <Card
                    key={document.id}
                    className="flex flex-row items-center justify-between gap-4 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-10 shrink-0 flex-col overflow-hidden rounded-md border bg-background">
                        <div className="flex flex-1 items-center justify-center text-muted-foreground">
                          <FileUpIcon className="size-4" />
                        </div>
                        <div className="bg-orange-500 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
                          {document.file.name.split(".").pop()?.toUpperCase() ?? "FILE"}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {document.file.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(document.file.size)}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${document.file.name}`}
                      onClick={() =>
                        setDocuments((current) =>
                          current.filter((currentDocument) => currentDocument.id !== document.id)
                        )}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" className="h-10" />}
              >
                <PlusIcon className="size-4" />
                Add
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" sideOffset={8} className="w-72">
                <DropdownMenuItem onClick={() => setIsWebPagesDialogOpen(true)}>
                  <LinkIcon className="size-4" />
                  Add Web pages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileUpIcon className="size-4" />
                  Upload files
                  <span className="ml-auto text-xs text-muted-foreground">
                    Up to 50MB
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsTextDialogOpen(true)}>
                  <TypeIcon className="size-4" />
                  Add text
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <HandleGoogleFiles onAddFiles={handleAddFiles} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-sm text-muted-foreground">
            {isExistingKnowledgeBase
              ? "New uploads will be added to the selected knowledge base."
              : "Your first 10 knowledge bases are included at no extra charge."}
          </p>

          <DialogFooter className="flex-row items-center justify-end gap-2">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button disabled={isSaveDisabled || isSaving} onClick={handleSave}>
              {isSaving ? "Uploading..." : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
      <HandleTxtFiles
        open={isTextDialogOpen}
        onOpenChange={setIsTextDialogOpen}
        onAddFile={handleAddFile}
      />
      <HandleWebPages
        open={isWebPagesDialogOpen}
        onOpenChange={setIsWebPagesDialogOpen}
        onAddFiles={handleAddFiles}
      />
    </Dialog>
  )
}

// MISC CODE

function formatFileSize(size: number) {
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}K`
  return `${(size / (1024 * 1024)).toFixed(1)}MB`
}
