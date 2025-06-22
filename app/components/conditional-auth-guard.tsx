"use client"

import { usePathname } from "next/navigation"
import { AuthGuard } from "./auth-guard"

type ConditionalAuthGuardProps = {
  children: React.ReactNode
}

export function ConditionalAuthGuard({ children }: ConditionalAuthGuardProps) {
  const pathname = usePathname()
  
  // Don't apply auth guard to auth pages
  const isAuthPage = pathname.startsWith("/auth")
  
  if (isAuthPage) {
    return <>{children}</>
  }
  
  return <AuthGuard>{children}</AuthGuard>
} 