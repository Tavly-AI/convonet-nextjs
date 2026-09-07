import { BookOpenIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { type KnowledgeBaseItem } from "../_lib/knowledge-base-data"
import { KnowledgeBasesList } from "./knowledge-bases-list"
import { UploadDataModal } from "./upload-data-modal"

export function LeftSidebar({ knowledgeBases }: { knowledgeBases: KnowledgeBaseItem[] }) {
  return (
    <Card className="gap-4 p-4">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpenIcon className="size-4 text-muted-foreground" />
          Knowledge Base
        </CardTitle>
        <CardAction>
          <UploadDataModal />
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="px-0">
        <KnowledgeBasesList knowledgeBases={knowledgeBases} />
      </CardContent>
    </Card>
  )
}
