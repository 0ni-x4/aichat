"use client"

// Better Auth handles its own session management internally
// No additional provider wrapper is needed
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
} 