// app/providers/user-provider.tsx
"use client"

import { UserProfile } from "@/app/types/user"
import { useSession } from "@/lib/auth/client"
import {
  fetchUserProfile,
  signOutUser,
  subscribeToUserUpdates,
  updateUserProfile,
} from "@/lib/user-store/api"
import { createContext, useContext, useEffect, useState } from "react"

type UserContextType = {
  user: UserProfile | null
  isLoading: boolean
  updateUser: (updates: Partial<UserProfile>) => Promise<void>
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser?: UserProfile | null
}) {
  // Add error handling for useSession
  let session = null
  let isPending = false
  
  try {
    const sessionData = useSession()
    session = sessionData.data
    isPending = sessionData.isPending
  } catch (error) {
    console.warn("Better Auth session unavailable:", error)
    // Continue with guest user
  }

  const [user, setUser] = useState<UserProfile | null>(initialUser || null)
  const [isLoading, setIsLoading] = useState(false)

  // Update user based on session
  useEffect(() => {
    if (session?.user) {
      const sessionUser: UserProfile = {
        id: session.user.id,
        email: session.user.email,
        display_name: session.user.name || session.user.email,
        profile_image: session.user.image || "",
        anonymous: false,
        created_at: new Date().toISOString(),
        daily_message_count: 0,
        daily_reset: null,
        message_count: 0,
        preferred_model: null,
        premium: false,
        last_active_at: new Date().toISOString(),
        daily_pro_message_count: 0,
        daily_pro_reset: null,
        system_prompt: null,
      }
      setUser(sessionUser)
    } else if (!isPending) {
      // No guest user - require authentication
      setUser(null)
    }
  }, [session, isPending])

  const refreshUser = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const updatedUser = await fetchUserProfile(user.id)
      if (updatedUser) setUser(updatedUser)
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      const success = await updateUserProfile(user.id, updates)
      if (success) {
        setUser((prev) => (prev ? { ...prev, ...updates } : null))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const success = await signOutUser()
      if (success) {
        // Clear user state on sign out
        setUser(null)
        // Redirect to login
        window.location.href = "/auth"
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Set up realtime subscription for user data changes
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribeToUserUpdates(user.id, (newData) => {
      setUser((prev) => (prev ? { ...prev, ...newData } : null))
    })

    return () => {
      unsubscribe()
    }
  }, [user?.id])

  return (
    <UserContext.Provider
      value={{ 
        user, 
        isLoading: isLoading || isPending, 
        updateUser, 
        refreshUser, 
        signOut 
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use the user context
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
