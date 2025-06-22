import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all general memories for the user
    const memories = await prisma.memory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error("Error fetching general memories:", error)
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Create new general memory
    const memory = await prisma.memory.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        summary: summary?.trim() || null,
        importance: importance || 5,
        tags: tags || null,
      },
    })

    return NextResponse.json(memory)
  } catch (error) {
    console.error("Error creating general memory:", error)
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500 }
    )
  }
} 