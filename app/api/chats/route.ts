import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const projectId = searchParams.get("projectId")

    // Verify the user can only access their own chats
    if (userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Build where clause for filtering
    const whereClause: any = {
      userId: session.user.id,
    }

    // Filter by project if specified
    if (projectId) {
      whereClause.projectId = projectId
    }

    // Get chats for the user (optionally filtered by project)
    const dbChats = await prisma.chat.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        model: true,
        public: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
        userId: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Convert to expected format
    const chats = dbChats.map((chat: any) => ({
      id: chat.id,
      title: chat.title || "New Chat",
      model: chat.model || "",
      public: chat.public,
      created_at: chat.createdAt.toISOString(),
      updated_at: chat.updatedAt.toISOString(),
      project_id: chat.projectId,
      user_id: chat.userId,
    }))

    return Response.json(chats)
  } catch (error) {
    console.error("Error fetching chats:", error)
    return Response.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
} 