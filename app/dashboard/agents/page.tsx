import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AgentsList, type AgentListItem } from "./_components/agents-list"
import { VOICES_UPDATED } from "@/app/agents/_data/voices-updated"
import { VOICES_FAKE_DATA } from "@/app/agents/_data/voices-fake-data"
import type { WorkspaceVoice } from "@/app/agents/_components/voice/voices-actions"
import type { AgentChannel } from "@/lib/constants"

export default async function Page() {
  const userId = await getCurrentUserId()
  if (!userId) redirect("/auth/login")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceId: true },
  })

  if (!user) redirect("/auth/login")

  const agents = user.workspaceId
    ? await prisma.agent.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { updatedAt: "desc" },
    })
    : []


  // ============================================================
  // ================ CUSTOM VOICES LOGIC =======================
  // ============================================================

  const hasCustomVoice = agents.some((agent) => {
    const config = agent.config as Record<string, unknown>
    const voiceId = config.voiceId ?? config.voice_id

    return voiceId && !VOICES_UPDATED.some((voice) => voice.voice_id === voiceId)
  })

  const customVoices = hasCustomVoice && user.workspaceId
    ? await prisma.workspace.findUnique({
      where: { id: user.workspaceId },
      select: { customVoices: true },
    }).then((workspace) => Array.isArray(workspace?.customVoices) ? workspace.customVoices as WorkspaceVoice[] : [])
    : []

  // ============================================================
  // ============== CUSTOM VOICES LOGIC END =====================
  // ============================================================


  const items: AgentListItem[] = agents.map((agent) => {
    const config = agent.config as Record<string, unknown>
    const voiceId = config.voiceId ?? config.voice_id

    // select values for both normal and custom voice
    // whatever exists we will go with that
    const normalvoice = VOICES_UPDATED.find(({ voice_id }) => voice_id === voiceId)
    const customVoice = !normalvoice ? customVoices.find((item) => typeof item === "object" && item !== null && "voice_id" in item && item.voice_id === voiceId) : null

    return {
      id: agent.id,
      name: agent.name,
      type: String(config.agentType),
      channel: agent.channel as AgentChannel,
      voice: normalvoice
        ? { name: normalvoice.name, avatarUrl: VOICES_FAKE_DATA[0].avatar_url }
        : customVoice && "name" in customVoice
          ? { name: String(customVoice.name), avatarUrl: "" }
          : null,
      phone: String(config.phone ?? config.phoneNumber ?? "-"),
      updatedAt: new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .format(agent.updatedAt)
        .replace(",", " ·"),
    }
  })

  return (
    <main className="flex flex-1 flex-col p-4 lg:p-6">
      <AgentsList agents={items} />
    </main>
  )
}
