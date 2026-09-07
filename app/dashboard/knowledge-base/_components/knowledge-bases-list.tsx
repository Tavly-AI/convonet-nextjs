"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { type KnowledgeBaseItem } from "../_lib/knowledge-base-data"

export function KnowledgeBasesList({ knowledgeBases }: { knowledgeBases: KnowledgeBaseItem[] }) {

  // resolve params
  const searchParams = useSearchParams()
  const knowledgeBaseId = searchParams.get("knowledgeBaseId")

  const selectedKnowledgeBaseId = knowledgeBases.some((knowledgeBase) => knowledgeBase.id === knowledgeBaseId) ? knowledgeBaseId : knowledgeBases[0]?.id

  return (
    <div className="flex flex-col gap-1">
      {knowledgeBases.map((knowledgeBase) => (
        <Link
          key={knowledgeBase.id}
          href={`/dashboard/knowledge-base?knowledgeBaseId=${encodeURIComponent(knowledgeBase.id)}`}
          className={cn(
            buttonVariants({
              variant:
                knowledgeBase.id === selectedKnowledgeBaseId
                  ? "secondary"
                  : "ghost",
            }),
            "h-10 justify-start px-3 text-left"
          )}
        >
          {knowledgeBase.name}
        </Link>
      ))}

      {!knowledgeBases.length && (
        <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
          No knowledge bases yet.
        </div>
      )}
    </div>
  )
}
