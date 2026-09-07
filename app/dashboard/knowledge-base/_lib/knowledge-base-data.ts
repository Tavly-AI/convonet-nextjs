import "server-only"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"

export type KnowledgeBaseDocument = {
  id: string
  name: string
  type: string
  fileUrl: string | null
  fileSize: number | null
  status: string | null
  uploadedAt: string
}

export type KnowledgeBaseItem = {
  id: string
  name: string
  createdAt: string
  documents: KnowledgeBaseDocument[]
}

export async function getKnowledgeBases(): Promise<KnowledgeBaseItem[]> {
  const workspaceId = await getCurrentWorkspaceId()

  const knowledgeBases = await prisma.knowledgeBase.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      sources: {
        orderBy: { createdAt: "desc" },
      },
    },
  })

  return knowledgeBases.map((knowledgeBase) => ({
    id: knowledgeBase.id,
    name: knowledgeBase.name,
    createdAt: knowledgeBase.createdAt.toISOString(),
    documents: knowledgeBase.sources.map((source) => ({
      id: source.id,
      name: source.filename,
      type: source.type,
      fileUrl: source.fileUrl,
      fileSize: source.fileSize ?? null,
      status: source.status ?? null,
      uploadedAt: source.createdAt.toISOString(),
    })),
  }))
}
