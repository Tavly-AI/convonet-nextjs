"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { useRef, useState } from "react"

type GoogleCredentialResponse = {
  credential: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
          }) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number>
          ) => void
        }
      }
    }
  }
}

export function GoogleOAuth() {
  const router = useRouter()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleGoogleLogin = async ({ credential }: GoogleCredentialResponse) => {
    setError("")
    setIsRedirecting(true)

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error || "Google login failed")
      }

      router.replace("/dashboard")
      router.refresh()
    } catch (error) {
      setIsRedirecting(false)
      setError(error instanceof Error ? error.message : "Google login failed")
    }
  }

  const initializeGoogleButton = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const button = buttonRef.current

    if (!clientId) {
      setIsLoading(false)
      setError("Google sign-in is not configured.")
      return
    }

    if (!button || !window.google) {
      setIsLoading(false)
      setError("Google sign-in could not be loaded.")
      return
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleLogin,
    })

    button.replaceChildren()
    window.google.accounts.id.renderButton(button, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "rectangular",
      width: button.clientWidth,
    })
    setIsLoading(false)
  }

  return (
    <div className="grid gap-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={initializeGoogleButton}
        onError={() => {
          setIsLoading(false)
          setError("Google sign-in could not be loaded.")
        }}
      />

      <div className="relative min-h-10 w-full">
        <div
          ref={buttonRef}
          className={isRedirecting ? "invisible flex justify-center" : "flex justify-center"}
        />

        {(isLoading || isRedirecting) && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="absolute inset-0 w-full"
            disabled
          >
            <Spinner />
            {isRedirecting ? "Signing in..." : "Loading Google..."}
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
