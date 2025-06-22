import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import type { Message as MessageAISDK } from "ai"

export async function GET(
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

    // Get messages for the chat
    const dbMessages = await prisma.message.findMany({
      where: {
        chatId,
      },
      select: {
        id: true,
        content: true,
        role: true,
        parts: true,
        experimentalAttachments: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Convert to AI SDK format
    const messages: MessageAISDK[] = dbMessages.map((message: any) => ({
      id: String(message.id),
      role: message.role as any,
      content: message.content || "",
      createdAt: message.createdAt,
      parts: message.parts ? JSON.parse(message.parts) : undefined,
      experimental_attachments: message.experimentalAttachments 
        ? JSON.parse(message.experimentalAttachments) 
        : undefined,
    }))

    return Response.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

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
    const message = await request.json()

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

    // Save the message
    await prisma.message.create({
      data: {
        chatId,
        userId: session.user.id,
        role: message.role,
        content: message.content,
        parts: message.parts ? JSON.stringify(message.parts) : null,
        experimentalAttachments: message.experimental_attachments 
          ? JSON.stringify(message.experimental_attachments) 
          : null,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error saving message:", error)
    return Response.json({ error: "Failed to save message" }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete all messages for this chat
    await prisma.message.deleteMany({
      where: { chatId },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error clearing messages:", error)
    return Response.json({ error: "Failed to clear messages" }, { status: 500 })
  }
} 