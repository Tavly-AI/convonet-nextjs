import { getCurrentUserId } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AgentsList, type AgentListItem } from "./_components/agents-list"
import { VOICES_UPDATED } from "@/app/agents/_data/voices-updated"
import { VOICES_FAKE_DATA } from "@/app/agents/_data/voices-fake-data"

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

  const items: AgentListItem[] = agents.map((agent) => {
    const config = agent.config as Record<string, unknown>
    const voiceId = config.voiceId ?? config.voice_id
    const voice = VOICES_UPDATED.find(({ voice_id }) => voice_id === voiceId)

    return {
      id: agent.id,
      name: agent.name,
      type: String(config.agentType),
      voice: voice
        ? { name: voice.name, avatarUrl: VOICES_FAKE_DATA[0].avatar_url }
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
