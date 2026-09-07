"use server"

import "server-only"

import { revalidatePath } from "next/cache"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { prisma } from "@/lib/prisma"

import { deleteFileS3 } from "./delete-file-s3"

type KnowledgeBaseFile = {
  filename: string
  fileUrl: string
  fileSize?: number | null
  type?: string
  ingestionJobId?: string | null
  status?: string | null
}

// ==================================================
// ============ CREATE KNOWLEDGE BASE ===============
// ==================================================

export async function createKnowledgeBaseTable({
  knowledgeBaseName,
  files,
}: {
  knowledgeBaseName: string
  files: KnowledgeBaseFile[]
}) {
  const name = knowledgeBaseName.trim()

  if (!name) {
    throw new Error("Knowledge base name is required.")
  }

  if (!files.length) {
    throw new Error("At least one file is required.")
  }

  const workspaceId = await getCurrentWorkspaceId()

  const knowledgeBase = await prisma.knowledgeBase.create({
    data: {
      workspaceId,
      name,
      sources: {
        create: files.map((file) => ({
          type: file.type ?? "document",
          filename: file.filename,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize ?? null,
          status: file.status ?? null,
          ingestionJobId: file.ingestionJobId ?? null,
        })),
      },
    },
  })

  revalidatePath("/dashboard/knowledge-base")

  return {
    knowledgeBaseId: knowledgeBase.id,
    knowledgeBaseName: knowledgeBase.name,
    sourcesCreated: files.length,
  }
}

// ==================================================
// ============== UPDATE KNOWLEDGE BASE =============
// ==================================================

export async function updateKnowledgeBaseTable({
  knowledgeBaseId,
  files,
}: {
  knowledgeBaseId: string
  files: KnowledgeBaseFile[]
}) {
  if (!files.length) {
    throw new Error("At least one file is required.")
  }

  const workspaceId = await getCurrentWorkspaceId()

  const knowledgeBase = await prisma.knowledgeBase.findFirst({
    where: {
      id: knowledgeBaseId,
      workspaceId,
    },
  })

  if (!knowledgeBase) {
    throw new Error("Knowledge base not found.")
  }

  await prisma.knowledgeBaseSource.createMany({
    data: files.map((file) => ({
      knowledgeBaseId,
      type: file.type ?? "document",
      filename: file.filename,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize ?? null,
      status: file.status ?? null,
      ingestionJobId: file.ingestionJobId ?? null,
    })),
  })

  revalidatePath("/dashboard/knowledge-base")

  return {
    knowledgeBaseId: knowledgeBase.id,
    knowledgeBaseName: knowledgeBase.name,
    sourcesCreated: files.length,
  }
}

// ==================================================
// ============== DELETE KNOWLEDGE BASE =============
// ==================================================

export async function deleteKnowledgeBaseTable(knowledgeBaseId: string) {
  const workspaceId = await getCurrentWorkspaceId()

  const knowledgeBase = await prisma.knowledgeBase.findFirst({
    where: {
      id: knowledgeBaseId,
      workspaceId,
    },
    include: {
      sources: {
        select: {
          fileUrl: true,
        },
      },
    },
  })

  if (!knowledgeBase) {
    throw new Error("Knowledge base not found.")
  }

  await Promise.all(
    knowledgeBase.sources
      .map((source) => source.fileUrl)
      .filter((fileUrl): fileUrl is string => Boolean(fileUrl))
      .map((fileUrl) => deleteFileS3(fileUrl))
  )

  await prisma.knowledgeBase.delete({
    where: { id: knowledgeBase.id },
  })

  revalidatePath("/dashboard/knowledge-base")

  return {
    knowledgeBaseId: knowledgeBase.id,
    knowledgeBaseName: knowledgeBase.name,
    sourcesDeleted: knowledgeBase.sources.length,
  }
}

export async function deleteKnowledgeBaseSourceTable({
  knowledgeBaseId,
  sourceId,
}: {
  knowledgeBaseId: string
  sourceId: string
}) {
  const workspaceId = await getCurrentWorkspaceId()

  const source = await prisma.knowledgeBaseSource.findFirst({
    where: {
      id: sourceId,
      knowledgeBaseId,
      knowledgeBase: { workspaceId },
    },
    select: {
      id: true,
      fileUrl: true,
    },
  })

  if (!source) {
    throw new Error("Knowledge base file not found.")
  }

  if (source.fileUrl) {
    await deleteFileS3(source.fileUrl)
  }

  await prisma.knowledgeBaseSource.delete({
    where: { id: source.id },
  })

  revalidatePath("/dashboard/knowledge-base")
}
