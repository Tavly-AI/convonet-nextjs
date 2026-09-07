"use client"

import { useState } from "react"
import Script from "next/script"
import { CloudIcon, LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

type GooglePickerDocument = {
  id: string
  mimeType?: string
  name?: string
}

type GooglePickerResponse = {
  action: string
  docs?: GooglePickerDocument[]
}

type GoogleTokenResponse = {
  access_token?: string
  error?: string
}

type GoogleDocsView = {
  setIncludeFolders: (includeFolders: boolean) => GoogleDocsView
  setSelectFolderEnabled: (enabled: boolean) => GoogleDocsView
  setMimeTypes: (mimeTypes: string) => GoogleDocsView
}

type GooglePickerBuilder = {
  enableFeature: (feature: string) => GooglePickerBuilder
  setDeveloperKey: (key: string) => GooglePickerBuilder
  setAppId: (appId: string) => GooglePickerBuilder
  setOAuthToken: (token: string) => GooglePickerBuilder
  addView: (view: GoogleDocsView) => GooglePickerBuilder
  setCallback: (callback: (response: GooglePickerResponse) => void) => GooglePickerBuilder
  build: () => { setVisible: (visible: boolean) => void }
}

type GoogleWindow = {
  accounts?: {
    oauth2?: {
      initTokenClient: (options: {
        client_id: string
        scope: string
        prompt: string
        callback: (response: GoogleTokenResponse) => void
      }) => {
        requestAccessToken: () => void
      }
    }
  }
  picker?: {
    Action: { PICKED: string; CANCEL: string }
    Feature: { MULTISELECT_ENABLED: string }
    DocsView: new () => GoogleDocsView
    PickerBuilder: new () => GooglePickerBuilder
  }
}

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: () => void) => void
    }
  }
}

const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
]

export function HandleGoogleFiles({ onAddFiles }: { onAddFiles: (files: File[]) => void }) {
  const [isLoading, setIsLoading] = useState(false)

  function handleConnect() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

    if (!clientId || !apiKey) {
      toast.error("Google Drive import is not configured.")
      return
    }

    const google = window.google as unknown as GoogleWindow | undefined

    if (!google?.accounts?.oauth2 || !window.gapi) {
      toast.error("Google Drive import is still loading. Please try again.")
      return
    }

    setIsLoading(true)

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      prompt: "select_account",
      callback: (tokenResponse) => {
        if (!tokenResponse.access_token) {
          setIsLoading(false)
          toast.error(tokenResponse.error || "Google Drive authorization was cancelled.")
          return
        }

        openPicker(tokenResponse.access_token, apiKey, clientId)
      },
    })

    tokenClient.requestAccessToken()
  }

  function openPicker(accessToken: string, apiKey: string, clientId: string) {
    window.gapi?.load("picker", () => {
      const google = window.google as unknown as GoogleWindow | undefined

      if (!google?.picker) {
        setIsLoading(false)
        toast.error("Google Drive picker could not be loaded.")
        return
      }

      const pickerApi = google.picker
      const view = new pickerApi.DocsView()
      view.setIncludeFolders(false)
      view.setSelectFolderEnabled(false)
      view.setMimeTypes(SUPPORTED_MIME_TYPES.join(","))

      const picker = new pickerApi.PickerBuilder()
        .enableFeature(pickerApi.Feature.MULTISELECT_ENABLED)
        .setDeveloperKey(apiKey)
        .setAppId(clientId.split("-", 1)[0])
        .setOAuthToken(accessToken)
        .addView(view)
        .setCallback((response) => {
          if (response.action === pickerApi.Action.CANCEL) {
            setIsLoading(false)
            return
          }

          if (response.action === pickerApi.Action.PICKED) {
            void downloadFiles(response.docs ?? [], accessToken)
          }
        })
        .build()

      picker.setVisible(true)
    })
  }

  async function downloadFiles(documents: GooglePickerDocument[], accessToken: string) {
    try {
      const files = await Promise.all(
        documents.map(async (document) => {
          if (!document.id || !document.name) {
            throw new Error("Google Drive returned an invalid file.")
          }

          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(document.id)}?alt=media`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )

          if (!response.ok) {
            throw new Error(`Could not download ${document.name} from Google Drive.`)
          }

          const blob = await response.blob()
          return new File([blob], document.name, { type: document.mimeType || blob.type })
        })
      )

      onAddFiles(files)
      toast.success(`${files.length} file${files.length === 1 ? "" : "s"} added from Google Drive.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not import Google Drive files.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <Script src="https://apis.google.com/js/api.js" strategy="afterInteractive" />
      <DropdownMenuItem disabled={isLoading} onClick={handleConnect}>
        {isLoading ? <LoaderCircleIcon className="size-4 animate-spin" /> : <CloudIcon className="size-4" />}
        {isLoading ? "Connecting Google Drive..." : "Connect Google Drive"}
      </DropdownMenuItem>
    </>
  )
}
