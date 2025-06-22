import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const { name, description, summary, startDate, targetDate } = await request.json()

    if (!name) {
      return new Response(JSON.stringify({ error: "Project name is required" }), {
        status: 400,
      })
    }

    // Create project in database
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        summary: summary || null,
        startDate: startDate ? new Date(startDate) : null,
        targetDate: targetDate ? new Date(targetDate) : null,
        userId: session.user.id,
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
      },
    })

    return Response.json(project)
  } catch (err: unknown) {
    console.error("Error creating project:", err)

    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get projects for the authenticated user
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
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
        _count: {
          select: {
            chats: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return Response.json(projects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return Response.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}
