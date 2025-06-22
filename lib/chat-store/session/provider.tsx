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
    console.log("🔍 SessionProvider - pathname:", pathname)
    
    if (pathname?.startsWith("/c/")) {
      const id = pathname.split("/c/")[1]
      console.log("🔍 SessionProvider - General chat ID extracted:", id)
      return id
    }
    if (pathname?.includes("/c/")) {
      // Handle project chat routes: /p/[projectId]/c/[chatId]
      const parts = pathname.split("/c/")
      if (parts.length > 1) {
        const id = parts[1]
        console.log("🔍 SessionProvider - Project chat ID extracted:", id)
        return id
      }
    }
    console.log("🔍 SessionProvider - No chat ID found")
    return null
  }, [pathname])

  return (
    <ChatSessionContext.Provider value={{ chatId }}>
      {children}
    </ChatSessionContext.Provider>
  )
}
