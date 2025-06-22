// @todo: move in /lib/user/api.ts
import { UserProfile } from "@/app/types/user"
import { toast } from "@/components/ui/toast"
import { signOut } from "@/lib/auth/client"

export async function fetchUserProfile(
  id: string
): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/user/${id}`)
    if (!response.ok) return null
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return null
  }
}

export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    
    return response.ok
  } catch (error) {
    console.error("Failed to update user:", error)
    return false
  }
}

export async function signOutUser(): Promise<boolean> {
  try {
    const result = await signOut()
    if (result.error) {
      console.error("Failed to sign out:", result.error)
      return false
    }
    return true
  } catch (error) {
    console.error("Failed to sign out:", error)
    toast({
      title: "Failed to sign out",
      description: "Please try again.",
      status: "error",
    })
    return false
  }
}

export function subscribeToUserUpdates(
  userId: string,
  onUpdate: (newData: Partial<UserProfile>) => void
) {
  // For now, return a no-op function since we're not using real-time updates
  // Could implement with WebSockets or polling if needed
  return () => {}
}
