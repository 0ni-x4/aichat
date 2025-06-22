import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { incrementMemoryUsage } from "@/lib/usage"

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get general memories for this user
    const memories = await prisma.memory.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        tags: true,
        importance: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { importance: "desc" },
        { updatedAt: "desc" }
      ],
    })

    // Parse tags for each memory
    const memoriesWithParsedTags = memories.map((memory: any) => ({
      ...memory,
      tags: memory.tags ? JSON.parse(memory.tags) : null,
    }))

    return NextResponse.json(memoriesWithParsedTags)
  } catch (error) {
    console.error("Error fetching memories:", error)
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, summary, tags, importance } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Create the memory
    const memory = await prisma.memory.create({
      data: {
        title,
        content,
        summary,
        tags: tags ? JSON.stringify(tags) : null,
        importance: importance || 5,
        userId: session.user.id,
      },
    })

    // Return with parsed tags
    const memoryWithParsedTags = {
      ...memory,
      tags: memory.tags ? JSON.parse(memory.tags) : null,
    }

    // Increment memory usage tracking
    await incrementMemoryUsage(session.user.id)

    return NextResponse.json(memoryWithParsedTags, { status: 201 })
  } catch (error) {
    console.error("Error creating memory:", error)
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500 }
    )
  }
} 