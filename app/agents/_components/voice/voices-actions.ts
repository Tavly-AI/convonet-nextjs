"use server"

import { getCurrentWorkspaceId } from "@/app/agents/_lib/helper-actions"
import { Prisma } from "@/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const workspaceVoiceSchema = z.object({
    provider: z.enum(["cartesia", "elevenlabs"]),
    voice_id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    preview_url: z.string().nullable(),
})

export type WorkspaceVoice = z.infer<typeof workspaceVoiceSchema>

// get custom voice in the workspace
export async function getWorkspaceVoices() {
    const workspaceId = await getCurrentWorkspaceId()
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { customVoices: true },
    })

    return parseWorkspaceVoices(workspace?.customVoices)
}

// add custom voice
export async function addVoiceToWorkspace(input: WorkspaceVoice) {
    const workspaceId = await getCurrentWorkspaceId()
    const voice = workspaceVoiceSchema.parse(input)
    const currentVoices = await getWorkspaceVoices()
    const nextVoices = [
        ...currentVoices.filter(
            (item) => item.provider !== voice.provider || item.voice_id !== voice.voice_id
        ),
        voice,
    ]

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { customVoices: nextVoices as Prisma.InputJsonValue },
    })

    return voice
}

// delete custom voice
export async function deleteVoiceFromWorkspace(input: Pick<WorkspaceVoice, "provider" | "voice_id">) {
    const workspaceId = await getCurrentWorkspaceId()
    const currentVoices = await getWorkspaceVoices()
    const nextVoices = currentVoices.filter(
        (item) => item.provider !== input.provider || item.voice_id !== input.voice_id
    )

    await prisma.workspace.update({
        where: { id: workspaceId },
        data: { customVoices: nextVoices as Prisma.InputJsonValue },
    })

    return nextVoices
}

// parse voice from workspace json column
function parseWorkspaceVoices(value: Prisma.JsonValue | null | undefined): WorkspaceVoice[] {
    if (!Array.isArray(value)) return []

    return value.filter((item): item is WorkspaceVoice => {
        const result = workspaceVoiceSchema.safeParse(item)
        return result.success
    })
}
