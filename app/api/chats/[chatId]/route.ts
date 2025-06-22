import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

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

    // Delete the chat (messages will be deleted via cascade)
    await prisma.chat.delete({
      where: { id: chatId },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return Response.json({ error: "Failed to delete chat" }, { status: 500 })
  }
}

export async function PATCH(
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
    const { title } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
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

    // Update the chat title
    await prisma.chat.update({
      where: { id: chatId },
      data: { 
        title,
        updatedAt: new Date(),
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error updating chat:", error)
    return Response.json({ error: "Failed to update chat" }, { status: 500 })
  }
} 