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
      const aiMessage: any = {
        id: String(message.id),
        role: message.role as any,
        content: message.content || "",
        createdAt: message.createdAt,
        experimental_attachments: message.experimentalAttachments 
          ? JSON.parse(message.experimentalAttachments) 
          : undefined,
      }

      // Parse parts and extract tool invocations if present
      if (message.parts) {
        try {
          const parsedParts = JSON.parse(message.parts)
          
          // Check if parts contains tool invocations
          if (parsedParts.toolInvocations) {
            aiMessage.toolInvocations = parsedParts.toolInvocations
            // If there's also content in the parsed parts, use that
            if (parsedParts.content) {
              aiMessage.content = parsedParts.content
            }
          } else {
            // If it's an array (like message content parts), assign to content
            if (Array.isArray(parsedParts)) {
              aiMessage.content = parsedParts
            }
          }
        } catch (error) {
          console.error("Error parsing message parts:", error)
        }
      }

      return aiMessage
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