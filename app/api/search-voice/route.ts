import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
    provider: z.enum(["cartesia", "elevenlabs"]),
    searchQuery: z.string(),
})

type VoiceSearchResult = {
    voice_id: string
    name: string
    preview_url: string | null
}

export async function GET(req: NextRequest) {
    const result = schema.safeParse({
        provider: req.nextUrl.searchParams.get("provider"),
        searchQuery: req.nextUrl.searchParams.get("search-query"),
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    const { provider, searchQuery } = result.data


    // =======================================================
    // ====================== 11Labs =========================
    // =======================================================

    if (provider === "elevenlabs") {
        const res = await fetch(`https://api.elevenlabs.io/v2/voices?search=${encodeURIComponent(searchQuery)}&page_size=100`, {
            headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
        })

        if (!res.ok) return NextResponse.json({ error: "ElevenLabs request failed" }, { status: res.status })

        const data = await res.json()

        const voices = data.voices.map((voice: any) => {
            const verified = voice.verified_languages?.[0]

            return {
                voice_id: voice.voice_id,
                name: voice.name,
                preview_url: verified?.preview_url ?? voice.preview_url ?? null,
            }
        })

        return NextResponse.json(voices)
    }

    // =======================================================
    // ====================== Cartesia =======================
    // =======================================================

    if (provider === "cartesia") {
        const params = new URLSearchParams({ q: searchQuery })
        params.append("expand[]", "preview_file_url")

        const res = await fetch(`https://api.cartesia.ai/voices?${params.toString()}`, {
            headers: { "X-API-Key": process.env.CARTESIA_API_KEY!, "Cartesia-Version": "2025-04-16" },
        })

        if (!res.ok) return NextResponse.json({ error: "Cartesia request failed" }, { status: res.status })

        const data = await res.json()

        const voices: VoiceSearchResult[] = data.data.map((voice: any) => ({
            voice_id: voice.id,
            name: voice.tagline ? `${voice.name} - ${voice.tagline}` : voice.name,
            preview_url: voice.preview_file_url ?? null,

        }))

        return NextResponse.json(voices)
    }

    return NextResponse.json(result.data)
}