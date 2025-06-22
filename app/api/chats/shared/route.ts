import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get public chats
    const sharedChats = await prisma.chat.findMany({
      where: {
        public: true,
      },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50, // Limit to recent 50
    })

    const formattedChats = sharedChats.map((chat: any) => ({
      id: chat.id,
      title: chat.title || "Shared Chat",
      model: chat.model || "",
      created_at: chat.createdAt.toISOString(),
      updated_at: chat.updatedAt.toISOString(),
      user_name: chat.user.name || chat.user.email,
    }))

    return Response.json(formattedChats)
  } catch (error) {
    console.error("Error fetching shared chats:", error)
    return Response.json({ error: "Failed to fetch shared chats" }, { status: 500 })
  }
} 