import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    // Get project from database
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        summary: true,
        startDate: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: {
          select: {
            chats: true,
            memories: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (err: unknown) {
    console.error("Error in project endpoint:", err)
    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params
    const { name, description, summary, startDate, targetDate } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      )
    }

    // Verify the project exists and belongs to the user
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (existingProject.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name.trim(),
        description: description || null,
        summary: summary || null,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        summary: true,
        startDate: true,
        targetDate: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        _count: {
          select: {
            chats: true,
            memories: true,
          },
        },
      },
    })

    return NextResponse.json(updatedProject)
  } catch (err: unknown) {
    console.error("Error updating project:", err)
    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await params

    // First verify the project exists and belongs to the user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the project (this will cascade delete related chats and memories due to FK constraints)
    await prisma.project.delete({
      where: { id: projectId },
    })

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("Error deleting project:", err)
    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}
