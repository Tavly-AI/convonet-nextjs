"use client"

import * as React from "react"
import {
  BadgeCheckIcon,
  Mic2Icon,
  PauseIcon,
  PlayIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VOICES_UPDATED, type Voice } from "../../_data/voices-updated"
import { VOICES_FAKE_DATA } from "../../_data/voices-fake-data"
import { getVoiceId, writeVoiceId } from "../../_lib/session-storage/agent-session"

export type VoiceModalPopupProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type GenderFilter = "all" | "female" | "male"
type Provider = Voice["provider"]

const PROVIDERS = [
  { value: "cartesia", label: "Cartesia" },
  { value: "elevenlabs", label: "ElevenLabs" },
] satisfies { value: Provider; label: string }[]

const ACCENTS = [
  ...new Set(VOICES_UPDATED.map((voice) => voice.accent).filter((accent): accent is string => accent !== null)),
].sort()

export function VoiceModalPopup({
  open,
  onOpenChange,
}: VoiceModalPopupProps) {
  const [provider, setProvider] = React.useState<Provider>("cartesia")
  const [gender, setGender] = React.useState<GenderFilter>("all")
  const [accent, setAccent] = React.useState("all")
  const [search, setSearch] = React.useState("")

  const selectedVoiceId = getVoiceId()

  const selectedVoice = React.useMemo(
    () => VOICES_UPDATED.find((voice) => voice.voice_id === selectedVoiceId),
    [selectedVoiceId]
  )

  const filteredVoices = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return VOICES_UPDATED.filter((voice) => {
      const matchesProvider = voice.provider === provider
      const matchesGender =
        gender === "all" || voice.gender.toLowerCase() === gender
      const matchesAccent = accent === "all" || voice.accent === accent
      const matchesSearch =
        !query ||
        voice.name.toLowerCase().includes(query) ||
        voice.voice_id.toLowerCase().includes(query)

      return matchesProvider && matchesGender && matchesAccent && matchesSearch
    })
  }, [accent, gender, provider, search])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-9 min-w-40 justify-start"
          />
        }
      >
        {selectedVoice ? (
          <>
            <VoiceAvatar voice={selectedVoice} size="sm" />
            <span className="max-w-24 truncate">{selectedVoice.name}</span>
            <span className="max-w-8 truncate font-mono text-xs text-muted-foreground">{selectedVoice.voice_id}</span>
          </>
        ) : (
          <>
            <Mic2Icon className="size-4 text-muted-foreground" />
            Select voice
          </>
        )}
      </DialogTrigger>


      <DialogContent className="flex h-[min(92svh,54rem)] max-w-[96rem] flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <DialogTitle className="text-xl sm:text-2xl">Select Voice</DialogTitle>
          <DialogDescription className="sr-only">
            Browse voices from custom providers.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <Tabs
            value={provider}
            onValueChange={(value) => setProvider(value as Provider)}
            className="gap-4"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5">
              {PROVIDERS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[15rem_15rem_minmax(16rem,1fr)]">
            <VoiceFilters
              gender={gender}
              onGenderChange={setGender}
              accent={accent}
              onAccentChange={setAccent}
              search={search}
              onSearchChange={setSearch}
            />
          </div>

          {filteredVoices.length === 0 ? (
            emptyState()
          ) : (
            <>
              {filteredVoices.some((voice) => voice.recommended) && (
                <section className="space-y-2">
                  <h2 className="font-medium">Recommended Voices</h2>
                  <div className="grid auto-cols-[minmax(18rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-1 xl:auto-cols-[minmax(20rem,calc((100%-2.25rem)/4))]">
                    {filteredVoices
                      .filter((voice) => voice.recommended)
                      .map((voice) => (
                        <VoiceCard key={voice.voice_id} voice={voice} />
                      ))}
                  </div>
                </section>
              )}

              <div className="overflow-hidden rounded-xl border">
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-16" />
                      <TableHead>Voice</TableHead>
                      <TableHead>Trait</TableHead>
                      <TableHead>Voice ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVoices.map((voice) => (
                      <TableRow key={voice.voice_id} className="group">
                        <TableCell>
                          <PreviewButton voice={voice} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <VoiceAvatar voice={voice} />
                            <span className="font-medium">{voice.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <Badge variant="secondary">{voice.accent}</Badge>
                            <Badge variant="secondary">{voice.language}</Badge>
                            <Badge variant="secondary">{voice.gender}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          {voice.voice_id}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="sm"
                            className="pointer-events-none opacity-0 transition-none group-hover:pointer-events-auto group-hover:opacity-100"
                            onClick={() => { writeVoiceId(voice.voice_id) }}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 items-center border-t bg-background px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:mr-auto">
            {selectedVoice ? (
              <>
                <VoiceAvatar voice={selectedVoice} />
                <span className="truncate font-medium">{selectedVoice.name}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">No voice selected</span>
            )}
          </div>
          <DialogClose render={<Button type="button" variant="outline" size="lg" />}>
            Cancel
          </DialogClose>
          <Button type="button" size="lg" disabled>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// MISC CODE

function VoiceFilters({
  gender,
  onGenderChange,
  accent,
  onAccentChange,
  search,
  onSearchChange,
}: {
  gender: GenderFilter
  onGenderChange: (value: GenderFilter) => void
  accent: string
  onAccentChange: (value: string) => void
  search: string
  onSearchChange: (value: string) => void
}) {
  return (
    <>
      <Select
        value={gender}
        onValueChange={(value) => onGenderChange(value as GenderFilter)}
      >
        <SelectTrigger size="default" className="h-9 w-full">
          <SelectValue>
            {gender === "all" ? "Gender" : gender === "female" ? "Female" : "Male"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All genders</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="male">Male</SelectItem>
        </SelectContent>
      </Select>

      <Select value={accent} onValueChange={(value) => onAccentChange(value ?? "all")}>
        <SelectTrigger size="default" className="h-9 w-full">
          <SelectValue>{accent === "all" ? "Accent" : accent}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All accents</SelectItem>
          {ACCENTS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search..."
        aria-label="Search voices"
        className="h-9 sm:col-span-2 xl:col-span-1"
      />
    </>
  )
}

function PreviewButton({ voice }: { voice: Voice }) {
  const [playing, setPlaying] = React.useState(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  function resetPreview() {
    audioRef.current = null
    setPlaying(false)
  }

  function togglePreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      resetPreview()
      return
    }

    const audio = new Audio(voice.preview_url ?? VOICES_FAKE_DATA[0].preview_audio_url)
    audioRef.current = audio
    audio.onended = resetPreview
    audio.onerror = resetPreview
    setPlaying(true)
    void audio.play().catch(resetPreview)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={`${playing ? "Pause" : "Preview"} ${voice.name}`}
      onClick={togglePreview}
    >
      {playing ? <PauseIcon /> : <PlayIcon className="fill-current" />}
    </Button>
  )
}

function VoiceAvatar({ voice, size = "lg" }: { voice: Voice, size?: "sm" | "lg" }) {
  return (
    <Avatar size={size} className="overflow-visible">
      <AvatarImage
        src={VOICES_FAKE_DATA[Math.floor(Math.random() * VOICES_FAKE_DATA.length)].avatar_url}
        alt={voice.name}
      />
      <AvatarFallback>{voice.name.slice(0, 1)}</AvatarFallback>
      {voice.recommended && (
        <BadgeCheckIcon className="absolute -top-1 -right-1 size-4 fill-emerald-500 text-background" />
      )}
    </Avatar>
  )
}

function VoiceCard({ voice }: { voice: Voice }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border bg-card p-3">
      <VoiceAvatar voice={voice} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{voice.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {voice.accent} · {voice.language} · {voice.gender}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          ID: {voice.voice_id}
        </p>
      </div>
      <PreviewButton voice={voice} />
    </div>
  )
}

function emptyState() {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
      No voices match these filters.
    </div>
  )
}
