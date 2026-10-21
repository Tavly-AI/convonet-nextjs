import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

const bedrock = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION })
const requestSchema = z.object({
    query: z.string().trim().min(1).max(1000),
    knowledge_base_ids: z.array(z.string().trim().min(1)),
    kb_config: z.object({
        top_k: z.number().int().min(1).max(100).default(3),
        filter_score: z.number().min(0).max(1).default(0.6),
    }).default({ top_k: 3, filter_score: 0.6 }),
})

export async function POST(request: NextRequest) {
    const body = requestSchema.safeParse(await request.json().catch(() => null))
    if (!body.success) return NextResponse.json({ error: "Provide knowledge_base_ids, a query (1–1000 characters), and valid optional kb_config settings." }, { status: 400 })

    try {
        const { query, knowledge_base_ids, kb_config: { top_k, filter_score } } = body.data
        if (!knowledge_base_ids.length) return NextResponse.json({ results: [] })

        const sources = await prisma.knowledgeBaseSource.findMany({
            where: {
                knowledgeBaseId: { in: knowledge_base_ids },
                fileUrl: { not: null },
            },
            select: { fileUrl: true, filename: true },
        })
        if (!sources.length) return NextResponse.json({ results: [] })

        const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID
        if (!knowledgeBaseId) return NextResponse.json({ error: "Bedrock knowledge base is not configured." }, { status: 503 })

        const { retrievalResults = [] } = await bedrock.send(new RetrieveCommand({
            knowledgeBaseId,
            retrievalQuery: { text: query },
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: top_k,
                    filter: {
                        in: { key: "x-amz-bedrock-kb-source-uri", value: sources.map(file => file.fileUrl!) },
                    },
                },
            },
        }), { abortSignal: AbortSignal.timeout(15_000) })
        const results = retrievalResults.flatMap(({ location, content, score }) => {
            const source = location?.s3Location?.uri
            const text = content?.text?.trim()
            const file = sources.find(file => file.fileUrl === source)
            if (!source || !file || !text || score === undefined || score < filter_score) return []
            return [{ text, score, source, filename: file.filename }]
        })

        return NextResponse.json({ results })
    } catch (error) {
        console.error("Knowledge-base retrieval failed:", error)
        return NextResponse.json({ error: "Knowledge-base retrieval failed." }, { status: 502 })
    }
}
