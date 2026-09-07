"use server"

import "server-only"

import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"

const s3 = new S3Client({
  region: process.env.AWS_REGION,
})

export async function deleteFileS3(fileUrl: string) {
  const bucket = process.env.KNOWLEDGE_BASE_BUCKET
  if (!bucket) {
    throw new Error("KNOWLEDGE_BASE_BUCKET is not configured.")
  }

  const { key, sourceBucket } = getS3Location(fileUrl)
  if (sourceBucket !== bucket) {
    throw new Error("File does not belong to the configured knowledge base bucket.")
  }

  const workspaceId = await getCurrentWorkspaceId()
  const prefix = process.env.KNOWLEDGE_BASE_PREFIX || "knowledge-base"
  if (!key.startsWith(`${prefix}/${workspaceId}/`)) {
    throw new Error("File does not belong to the current workspace.")
  }

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: [{ Key: key }, { Key: `${key}.metadata.json` }],
        Quiet: true,
      },
    })
  )
}

function getS3Location(fileUrl: string) {
  let url: URL

  try {
    url = new URL(fileUrl)
  } catch {
    throw new Error("File URL is invalid.")
  }

  const key = url.pathname.slice(1)
  if (url.protocol !== "s3:" || !url.hostname || !key) {
    throw new Error("File URL must be an S3 URL.")
  }

  return { sourceBucket: url.hostname, key }
}
