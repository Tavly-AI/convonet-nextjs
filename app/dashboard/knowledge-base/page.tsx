import { Suspense } from "react"

import { WebsiteCustomLoader } from "@/components/custom/website-custom-loader"
import { Card } from "@/components/ui/card"

import { LeftSidebar } from "./_components/left-sidebar"
import { RightDisplay } from "./_components/right-display"
import { getKnowledgeBases } from "./_lib/knowledge-base-data"

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ knowledgeBaseId?: string }>
}) {

  const knowledgeBases = await getKnowledgeBases()

  // resolve params
  const resolvedSearchParams = await searchParams
  const knowledgeBaseId = resolvedSearchParams?.knowledgeBaseId

  const selectedKnowledgeBase = knowledgeBases.find((knowledgeBase) => knowledgeBase.id === knowledgeBaseId) ?? knowledgeBases[0] ?? null

  return (
    <main className="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
      <div className="grid min-h-[calc(100vh-var(--header-height)-3rem)] gap-4 lg:grid-cols-[400px_1fr]">
        <Suspense fallback={<KnowledgeBaseSidebarLoading />}>
          <LeftSidebar knowledgeBases={knowledgeBases} />
        </Suspense>
        <Suspense
          key={selectedKnowledgeBase?.id ?? "default"}
          fallback={<KnowledgeBaseSidebarLoading />}
        >
          <RightDisplay knowledgeBase={selectedKnowledgeBase} />
        </Suspense>
      </div>
    </main>
  )
}

function KnowledgeBaseSidebarLoading() {
  return (
    <Card className="min-h-[60vh] gap-5 p-5">
      <div className="flex flex-1 items-center justify-center">
        <WebsiteCustomLoader
          title="Loading knowledge bases"
          detail="Fetching sidebar..."
        />
      </div>
    </Card>
  )
}
