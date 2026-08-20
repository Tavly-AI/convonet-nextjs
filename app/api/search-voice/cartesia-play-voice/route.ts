import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get("url")

    if (!url) { return NextResponse.json({ error: "Missing preview URL" }, { status: 400 }) }

    const previewUrl = new URL(url)

    if (previewUrl.hostname !== "files.cartesia.ai") { return NextResponse.json({ error: "Invalid preview URL" }, { status: 400 }) }

    const res = await fetch(previewUrl, { headers: { Authorization: `Bearer ${process.env.CARTESIA_API_KEY!}` } })

    if (!res.ok) { return NextResponse.json({ error: "Failed to fetch preview" }, { status: res.status }) }

    return new NextResponse(res.body, {
        headers: {
            "Content-Type": res.headers.get("Content-Type") ?? "audio/mpeg",
            "Cache-Control": "private, max-age=3600",
        },
    })
}