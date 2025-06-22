import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params
    
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user owns this memory
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { 
        id: true, 
        userId: true,
      },
    })

    if (!memory || memory.userId !== session.user.id) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, content, summary, tags, importance } = body

    // Update the memory
    const updatedMemory = await prisma.memory.update({
      where: { id: memoryId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(importance !== undefined && { importance }),
      },
    })

    // Return with parsed tags
    const memoryWithParsedTags = {
      ...updatedMemory,
      tags: updatedMemory.tags ? JSON.parse(updatedMemory.tags) : null,
    }

    return NextResponse.json(memoryWithParsedTags)
  } catch (error) {
    console.error("Error updating memory:", error)
    return NextResponse.json(
      { error: "Failed to update memory" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memoryId: string }> }
) {
  try {
    const { memoryId } = await params
    
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user owns this memory
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      select: { 
        id: true, 
        userId: true,
      },
    })

    if (!memory || memory.userId !== session.user.id) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 })
    }

    // Delete the memory
    await prisma.memory.delete({
      where: { id: memoryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting memory:", error)
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    )
  }
} 