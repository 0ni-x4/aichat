// Mock create chat API - returns mock chat data since we removed Supabase

import { prisma } from "@/lib/prisma"

type CreateChatInput = {
  userId: string
  title?: string
  model: string
  isAuthenticated: boolean
  projectId?: string
}

export async function createChat({
  userId,
  title,
  model,
  isAuthenticated,
  projectId,
}: CreateChatInput): Promise<{ id: string; title: string }> {
  try {
    // Create the chat in the database
    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        model,
        userId,
        projectId: projectId || null,
      },
      select: {
        id: true,
        title: true,
      },
    })

    return {
      id: chat.id,
      title: chat.title || "New Chat",
    }
  } catch (error) {
    console.error("Error creating chat:", error)
    throw new Error("Failed to create chat")
  }
}
