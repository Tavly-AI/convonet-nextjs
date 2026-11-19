"use server"

import "server-only"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

export async function scrubbed_post_session_uploadScrubbedAudioToS3(callId: string, audioUrl: string) {
    const bucket = process.env.CONVONENT_AWS_BUCKET
    const region = process.env.AWS_REGION
    const prefix = process.env.EGRESS_RECORDINGS_S3_BUCKET_PREFIX?.replace(/^\/+|\/+$/g, "")
    if (!bucket || !region || !prefix) throw new Error("S3 recordings storage is not configured")

    const response = await fetch(audioUrl, { signal: AbortSignal.timeout(120_000) })
    if (!response.ok) throw new Error(`Failed to download scrubbed audio: HTTP ${response.status}`)
    const audio = Buffer.from(await response.arrayBuffer())
    if (!audio.length) throw new Error("Scrubbed audio is empty")

    const key = `${prefix}/scrubbed/${encodeURIComponent(callId)}.mp3`
    const s3 = new S3Client({ region })
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: audio,
        ContentType: response.headers.get("content-type") || "audio/mpeg",
    }))

    return `https://${bucket}.s3.${region}.amazonaws.com/${key.split("/").map(encodeURIComponent).join("/")}`
}
