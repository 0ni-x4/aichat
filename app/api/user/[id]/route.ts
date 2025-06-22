import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { UserProfile } from "@/app/types/user"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = session.user
    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      display_name: user.name || user.email,
      profile_image: user.image || "",
      anonymous: false,
      created_at: user.createdAt.toISOString(),
      daily_message_count: 0, // These would come from a separate user stats table
      daily_reset: null,
      message_count: 0,
      preferred_model: null,
      premium: false,
      last_active_at: new Date().toISOString(),
      daily_pro_message_count: 0,
      daily_pro_reset: null,
      system_prompt: null,
    }

    return NextResponse.json(userProfile)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user || session.user.id !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    
    // For now, we'll just return success since Better Auth handles user data
    // In a real app, you'd update additional user preferences in your database
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 