import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"

/**
 * Validates the user's identity using Better Auth only
 * @param userId - The ID of the user.
 * @param isAuthenticated - Whether the user is authenticated.
 * @returns null since we're not using Supabase anymore
 */
export async function validateUserIdentity(
  userId: string,
  isAuthenticated: boolean
) {
  if (isAuthenticated) {
    try {
      // Use Better Auth to get the current session
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error("Unable to get authenticated user")
      }

      if (session.user.id !== userId) {
        throw new Error("User ID does not match authenticated user")
      }
    } catch (error) {
      throw new Error("Unable to get authenticated user")
    }
  }
  // For guest users, we no longer validate against any database
  // We removed guest functionality, so this shouldn't happen

  return null // No Supabase client needed
}
