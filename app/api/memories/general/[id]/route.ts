import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, summary, importance, tags } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Update the memory (only if it belongs to the user)
    const memory = await prisma.memory.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        title: title.trim(),
        content: content.trim(),
        summary: summary?.trim() || null,
        importance: importance || 5,
        tags: tags || null,
        updatedAt: new Date(),
      },
    })

    if (memory.count === 0) {
      return NextResponse.json(
        { error: "Memory not found or access denied" },
        { status: 404 }
      )
    }

    // Fetch the updated memory to return
    const updatedMemory = await prisma.memory.findUnique({
      where: { id },
    })

    return NextResponse.json(updatedMemory)
  } catch (error) {
    console.error("Error updating general memory:", error)
    return NextResponse.json(
      { error: "Failed to update memory" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete the memory (only if it belongs to the user)
    const result = await prisma.memory.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: "Memory not found or access denied" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting general memory:", error)
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    )
  }
} 