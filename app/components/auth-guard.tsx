"use client"

import { useUser } from "@/lib/user-store/provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

type AuthGuardProps = {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  // Show loading while checking auth or redirecting
  if (isLoading || !user) {
    return (
      <div className="bg-background flex h-dvh w-full flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    )
  }

  return <>{children}</>
} 