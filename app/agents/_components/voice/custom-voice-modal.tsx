"use client"

import * as React from "react"
import {
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Voice } from "../../_data/voices-updated"
import { addVoiceToWorkspace, type WorkspaceVoice } from "./voices-actions"

type Provider = Voice["provider"]
type VoiceSearchResult = {
  voice_id: string
  name: string
  preview_url: string | null
}

export function CustomVoiceModal({ provider, onVoiceAdded }: { provider: Provider, onVoiceAdded?: (voice: WorkspaceVoice) => void }) {
  const [query, setQuery] = React.useState("")
  const [voices, setVoices] = React.useState<VoiceSearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const [playingVoiceId, setPlayingVoiceId] = React.useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const [savingVoiceId, setSavingVoiceId] = React.useState<string | null>(null)
  const [savedVoiceId, setSavedVoiceId] = React.useState<string | null>(null)

  async function searchVoices(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        provider,
        "search-query": query.trim(),
      })
      const response = await fetch(`/api/search-voice?${params}`)
      if (!response.ok) throw new Error()
      setVoices(await response.json())
    } catch {
      setVoices([])
      setError("Could not search voices.")
    } finally {
      setLoading(false)
    }
  }

  function togglePreview(voice: VoiceSearchResult) {
    if (!voice.preview_url) return

    if (playingVoiceId === voice.voice_id) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlayingVoiceId(null)
      return
    }

    audioRef.current?.pause()

    const previewUrl =
      provider === "cartesia"
        ? `/api/search-voice/cartesia-play-voice?url=${encodeURIComponent(voice.preview_url)}`
        : voice.preview_url
    const audio = new Audio(previewUrl)

    audio.onended = () => setPlayingVoiceId(null)
    audio.onerror = () => setPlayingVoiceId(null)
    audioRef.current = audio
    setPlayingVoiceId(voice.voice_id)
    void audio.play().catch(() => setPlayingVoiceId(null))
  }

  async function addVoice(voice: VoiceSearchResult) {
    setSavingVoiceId(voice.voice_id)
    setError("")

    try {
      const addedVoice = await addVoiceToWorkspace({ ...voice, provider })
      setSavedVoiceId(voice.voice_id)
      onVoiceAdded?.(addedVoice)
    } catch {
      setError("Could not add voice.")
    } finally {
      setSavingVoiceId(null)
    }
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" className="h-9" />}>
        <PlusIcon />
        Add custom voice
      </DialogTrigger>

      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle>Add custom voice</DialogTitle>
          <DialogDescription>
            Search {provider} and save a voice to this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          <form className="flex gap-2" onSubmit={searchVoices}>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Voice name or ID"
            />
            <Button type="submit" disabled={!query.trim() || loading}>
              {loading ? <Loader2Icon className="animate-spin" /> : <SearchIcon />}
              Search
            </Button>
          </form>

          <div className="max-h-80 overflow-y-auto rounded-lg border">
            {error ? (
              <p className="p-4 text-sm text-destructive">{error}</p>
            ) : voices.length ? (
              voices.map((voice) => (
                <div
                  key={voice.voice_id}
                  className="flex items-center gap-3 border-b p-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{voice.name}</p>
                  </div>
                  {voice.preview_url && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => togglePreview(voice)}
                    >
                      {playingVoiceId === voice.voice_id ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon className="fill-current" />
                      )}
                      <span className="sr-only">Preview {voice.name}</span>
                    </Button>
                  )}
                  <Button
                    variant={"outline"}
                    type="button"
                    size="sm"
                    disabled={savingVoiceId === voice.voice_id}
                    onClick={() => void addVoice(voice)}
                  >
                    {savingVoiceId === voice.voice_id && (
                      <Loader2Icon className="animate-spin" />
                    )}
                    {savedVoiceId === voice.voice_id ? "Added" : "Add"}
                  </Button>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Search for a voice to see results.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4 sm:px-6">
          <DialogClose render={<Button type="button" variant="outline" />}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
