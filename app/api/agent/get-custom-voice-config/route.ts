import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

type CustomVoice = {
  provider: "cartesia" | "elevenlabs"
  voice_id: string
}

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agentId")
  const voiceId = request.nextUrl.searchParams.get("voiceId")

  if (!agentId || !voiceId) { return NextResponse.json({ error: "agentId and voiceId are required" }, { status: 400 }) }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { workspace: { select: { customVoices: true } } },
  })

  const voices = Array.isArray(agent?.workspace.customVoices) ? agent.workspace.customVoices as CustomVoice[] : []

  const voice = voices.find((voice) => voice.voice_id === voiceId)

  if (!voice) { return NextResponse.json({ error: "Custom voice not found" }, { status: 404 }) }

  return NextResponse.json({ provider: voice.provider })
}
