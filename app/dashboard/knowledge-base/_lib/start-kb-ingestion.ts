"use server"

import "server-only"

import {
    BedrockAgentClient,
    StartIngestionJobCommand,
} from "@aws-sdk/client-bedrock-agent"

const bedrock = new BedrockAgentClient({
    region: process.env.AWS_REGION,
})

export async function startKnowledgeBaseIngestion() {
    const knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID
    const dataSourceId = process.env.BEDROCK_DATA_SOURCE_ID

    if (!knowledgeBaseId) {
        throw new Error("BEDROCK_KNOWLEDGE_BASE_ID is not configured.")
    }

    if (!dataSourceId) {
        throw new Error("BEDROCK_DATA_SOURCE_ID is not configured.")
    }

    const response = await bedrock.send(
        new StartIngestionJobCommand({
            knowledgeBaseId,
            dataSourceId,
        })
    )

    return {
        ingestionJobId: response.ingestionJob?.ingestionJobId,
        status: response.ingestionJob?.status,
    }
}
