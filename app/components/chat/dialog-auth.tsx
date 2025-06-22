"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signIn } from "@/lib/auth/client"

import { useState } from "react"

const isDesktop = () => {
  return typeof window !== "undefined" && 
         typeof (window as any).__TAURI__ !== "undefined"
}

type DialogAuthProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DialogAuth({ open, setOpen }: DialogAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (isDesktop()) {
        // Desktop OAuth flow - redirect to login page
        window.location.href = "/auth"
      } else {
        // Web OAuth flow
        const data = await signIn.social({
          provider: "google",
          callbackURL: "/",
        })

        if (data.error) {
          setError(data.error.message || "Failed to sign in with Google")
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            You&apos;ve reached the limit for today
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            Sign in below to increase your message limits.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}
        <DialogFooter className="mt-6 sm:justify-center">
          <Button
            variant="secondary"
            className="w-full text-base"
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
            <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
