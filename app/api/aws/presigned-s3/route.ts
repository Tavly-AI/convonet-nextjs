import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { NextRequest, NextResponse } from "next/server"

const s3 = new S3Client({ region: "eu-central-1" })

export async function GET(req: NextRequest) {
    const bucket = process.env.CONVONENT_AWS_BUCKET
    if (!bucket) { return NextResponse.json({ error: "S3 bucket is not configured" }, { status: 500 }) }

    const url = req.nextUrl.searchParams.get("url")
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 })

    const Key = decodeURIComponent(new URL(url).pathname.slice(1))

    const signedUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: bucket,
            Key,
        }),
        { expiresIn: 3600 },
    )

    return NextResponse.json({ url: signedUrl })
}
