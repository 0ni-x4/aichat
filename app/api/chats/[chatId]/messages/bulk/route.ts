import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import type { Message as MessageAISDK } from "ai"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId } = await params
    const { messages }: { messages: MessageAISDK[] } = await request.json()

    if (!Array.isArray(messages)) {
      return Response.json({ error: "Messages must be an array" }, { status: 400 })
    }

    // Verify the user owns this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    })

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prepare message data for bulk insert
    const messageData = messages.map((message) => ({
      chatId,
      userId: session.user.id,
      role: message.role,
      content: message.content,
      parts: message.parts ? JSON.stringify(message.parts) : null,
      experimentalAttachments: message.experimental_attachments 
        ? JSON.stringify(message.experimental_attachments) 
        : null,
    }))

    // Save all messages at once
    await prisma.message.createMany({
      data: messageData,
    })

    return Response.json({ success: true, count: messages.length })
  } catch (error) {
    console.error("Error saving messages in bulk:", error)
    return Response.json({ error: "Failed to save messages" }, { status: 500 })
  }
} 