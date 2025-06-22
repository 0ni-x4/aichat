"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useMemo } from "react"

const ChatSessionContext = createContext<{ chatId: string | null }>({
  chatId: null,
})

export const useChatSession = () => useContext(ChatSessionContext)

export function ChatSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const chatId = useMemo(() => {
    if (pathname?.startsWith("/c/")) return pathname.split("/c/")[1]
    if (pathname?.includes("/c/")) {
      // Handle project chat routes: /p/[projectId]/c/[chatId]
      const parts = pathname.split("/c/")
      if (parts.length > 1) return parts[1]
    }
    return null
  }, [pathname])

  return (
    <ChatSessionContext.Provider value={{ chatId }}>
      {children}
    </ChatSessionContext.Provider>
  )
}
