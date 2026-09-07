"use server"

import "server-only"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"

export type UploadedKnowledgeBaseFile = {
    bucket: string
    key: string
    url: string
    filename: string
    contentType: string | null
    size: number
}

const s3 = new S3Client({
    region: process.env.AWS_REGION,
})

export async function appendFileS3(
    file: File
): Promise<UploadedKnowledgeBaseFile> {
    if (!(file instanceof File)) {
        throw new Error("A file is required.")
    }

    if (!file.size) {
        throw new Error("File is empty.")
    }

    const bucket = process.env.KNOWLEDGE_BASE_BUCKET
    if (!bucket) {
        throw new Error("KNOWLEDGE_BASE_BUCKET is not configured.")
    }

    const workspaceId = await getCurrentWorkspaceId()
    const prefix = process.env.KNOWLEDGE_BASE_PREFIX || "knowledge-base"
    const filename = file.name || "upload"
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-")
    const key = `${prefix}/${workspaceId}/${Date.now()}-${safeFilename}`

    // upload file
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: file.type || undefined,
        })
    )

    // upload meta data file
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: `${key}.metadata.json`,
            Body: JSON.stringify({
                metadataAttributes: {
                    user_id: String(workspaceId),
                    kb_id: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
                    source_id: process.env.BEDROCK_DATA_SOURCE_ID,
                },
            }),
            ContentType: "application/json",
        })
    )

    return {
        bucket,
        key,
        url: `s3://${bucket}/${key}`,
        filename,
        contentType: file.type || null,
        size: file.size,
    }
}
