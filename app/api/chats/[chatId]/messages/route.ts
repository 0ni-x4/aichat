import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import type { Message as MessageAISDK } from "ai"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user owns this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
    const messages: MessageAISDK[] = dbMessages.map((message: any) => {
      // For user messages, use the simple format
      if (message.role === "user") {
        const aiMessage: MessageAISDK = {
          id: String(message.id),
          role: message.role,
          content: message.content || "",
          createdAt: message.createdAt,
        }

        if (message.experimentalAttachments) {
          try {
            aiMessage.experimental_attachments = JSON.parse(
              message.experimentalAttachments
            )
          } catch (e) {
            console.error("Failed to parse experimental_attachments", e)
          }
        }

        return aiMessage
      }

      // For assistant messages, check if we have the full message stored in parts
      if (message.role === "assistant" && message.parts) {
        try {
          // Parse the complete message object from parts
          const storedMessage = JSON.parse(message.parts)
          
          // If it's a complete message object, use it directly
          if (storedMessage.role && storedMessage.content !== undefined) {
            return {
              ...storedMessage,
              id: String(message.id),
              createdAt: message.createdAt,
            }
          }
        } catch (error) {
          console.error("Error parsing stored message:", error)
        }
      }

      // Fallback for assistant messages without proper parts storage
      return {
        id: String(message.id),
        role: message.role,
        content: message.content || "",
        createdAt: message.createdAt,
      }
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const message = await request.json()

    // Verify the user owns this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params
    
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user owns this chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { userId: true },
    })

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete all messages for this chat
    await prisma.message.deleteMany({
      where: { chatId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing messages:", error)
    return NextResponse.json({ error: "Failed to clear messages" }, { status: 500 })
  }
} 