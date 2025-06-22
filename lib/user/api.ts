import type { UserProfile } from "@/app/types/user"
import { auth } from "@/lib/auth/config"
import { createClient } from "@/lib/supabase/server"

export async function getBetterAuthUser() {
  try {
    const session = await auth.api.getSession({
      headers: await import('next/headers').then(m => m.headers()),
    })
    return session
  } catch {
    return null
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const session = await getBetterAuthUser()
  
  if (!session?.user) {
    return null
  }

  const user = session.user
  
  return {
    id: user.id,
    email: user.email,
    display_name: user.name || user.email,
    profile_image: user.image || "",
    anonymous: false,
  } as UserProfile
}

// Keep this for file uploads - Supabase client without auth
export async function getSupabaseClient() {
  const supabase = await createClient()
  return supabase
}
