"use client"

import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function HandleTxtFiles({
  open,
  onOpenChange,
  onAddFile,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddFile: (file: File) => void
}) {
  const [textFileName, setTextFileName] = useState("")
  const [textFileContent, setTextFileContent] = useState("")
  const normalizedFileName = normalizeTextFileName(textFileName)

  function handleAddTextDocument(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

    const fileName = normalizeTextFileName(textFileName)
    const content = textFileContent.trim()

    if (!fileName) {
      toast.error("Enter a text file name.")
      return
    }

    if (!content) {
      toast.error("Enter text content.")
      return
    }

    const file = new File([textFileContent], fileName, {
      type: "text/plain",
      lastModified: Date.now(),
    })

    onAddFile(file)
    setTextFileName("")
    setTextFileContent("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 text-file-dialog" >
        <form onSubmit={handleAddTextDocument}>
          <DialogHeader className="border-b bg-muted/30 px-6 py-5 pr-14">
            <DialogTitle className="text-xl">Add Text File</DialogTitle>
            <DialogDescription>
              Create a plain text document and add it to this knowledge base.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="text-file-name">File Name</Label>
                <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium text-muted-foreground">
                  .txt
                </span>
              </div>
              <Input
                id="text-file-name"
                value={textFileName}
                onChange={(event) => setTextFileName(event.target.value)}
                placeholder="example"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {normalizedFileName
                  ? `Will be saved as ${normalizedFileName}`
                  : "Enter a name and the .txt extension will be added automatically."}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="text-file-content">Text</Label>
                <span className="text-xs text-muted-foreground">
                  {textFileContent.length.toLocaleString()} characters
                </span>
              </div>
              <Textarea
                id="text-file-content"
                value={textFileContent}
                onChange={(event) => setTextFileContent(event.target.value)}
                placeholder="Paste or type the content for this file..."
                className="min-h-56 resize-none leading-6"
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Text</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function normalizeTextFileName(fileName: string) {
  const normalizedFileName = fileName.trim().replace(/[\\/]/g, "-")

  if (!normalizedFileName) return ""
  if (normalizedFileName.toLowerCase().endsWith(".txt")) return normalizedFileName

  return `${normalizedFileName}.txt`
}
