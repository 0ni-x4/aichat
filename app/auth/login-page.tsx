"use client"

import { Button } from "@/components/ui/button"
import { signIn } from "@/lib/auth/client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { HeaderGoBack } from "../components/header-go-back"

const isDesktop = () => {
  return typeof window !== "undefined" && 
         typeof (window as any).__TAURI__ !== "undefined"
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  async function handleSignInWithGoogle() {
    try {
      setIsLoading(true)
      setError(null)

      if (isClient && isDesktop()) {
        // Desktop OAuth flow - open OAuth URL in system browser
        try {
          // Manually construct the Better Auth OAuth URL
          const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`)
          const oauthUrl = `${window.location.origin}/api/auth/sign-in/social?provider=google&callbackURL=${callbackUrl}`
          
          // Use Tauri shell plugin to open in system browser
          const { open } = await import('@tauri-apps/plugin-shell')
          await open(oauthUrl)
          console.log("Successfully opened OAuth URL in system browser:", oauthUrl)
          
          // Show user instruction
          setError("Opening browser for authentication. Please complete the login process in your browser, then return to this app.")
          
          // Poll for authentication completion
          const pollForAuth = async () => {
            try {
              const sessionResponse = await fetch('/api/auth/get-session')
              if (sessionResponse.ok) {
                const session = await sessionResponse.json()
                if (session?.user) {
                  window.location.reload() // Refresh the app
                  return
                }
              }
              // Keep polling
              setTimeout(pollForAuth, 2000)
            } catch (err) {
              console.error("Polling error:", err)
              setTimeout(pollForAuth, 2000)
            }
          }
          
          setTimeout(pollForAuth, 1000)
          
        } catch (tauriError) {
          console.error("Desktop OAuth failed:", tauriError)
          setError("Failed to open system browser. Make sure you're running the desktop app and try again.")
        }
      } else {
        // Web OAuth flow
        const data = await signIn.social({
          provider: "google",
          callbackURL: "/",
        })

        if (data.error) {
          if (data.error.message?.includes("Provider") || data.error.message?.includes("google")) {
            setError("Google OAuth is not configured. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables.")
          } else {
            setError(data.error.message || "Failed to sign in with Google")
          }
        }
      }
    } catch (err: unknown) {
      console.error("Error signing in with Google:", err)
      setError(
        (err as Error).message ||
          "An unexpected error occurred. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background flex h-dvh w-full flex-col">
      <HeaderGoBack href="/" />

      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-foreground text-3xl font-medium tracking-tight sm:text-4xl">
              Welcome to Coreframe
            </h1>
            <p className="text-muted-foreground mt-3">
              {isClient && isDesktop() 
                ? "Sign in below to increase your message limits. The authentication will open in your browser."
                : "Sign in below to increase your message limits."
              }
            </p>
          </div>
          {error && (
            <div className={`rounded-md p-3 text-sm ${
              error.includes("Opening browser") 
                ? "bg-blue-10 text-blue-700 border border-blue-200" 
                : "bg-destructive/10 text-destructive"
            }`}>
              {error}
            </div>
          )}
          <div className="mt-8">
            <Button
              variant="secondary"
              className="w-full text-base sm:text-base"
              size="lg"
              onClick={handleSignInWithGoogle}
              disabled={isLoading}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google logo"
                width={20}
                height={20}
                className="mr-2 size-4"
              />
              <span>
                {isLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </Button>
          </div>
        </div>
      </main>

      <footer className="text-muted-foreground py-6 text-center text-sm">
        {/* @todo */}
        <p>
          By continuing, you agree to our{" "}
          <Link href="/" className="text-foreground hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  )
}
