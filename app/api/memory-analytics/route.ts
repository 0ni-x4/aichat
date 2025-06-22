import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { checkMemoryUsage } from "@/lib/usage"

export async function GET(request: Request) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get overall memory usage statistics
    const memoryStats = await checkMemoryUsage(userId)

    // Get memory count per project
    const projectMemories = await prisma.projectMemory.groupBy({
      by: ['projectId'],
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    })

    // Get project names for the memory counts
    const projectIds = projectMemories.map((pm: any) => pm.projectId)
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    })

    // Combine project data with memory counts
    const projectMemoryStats = projectMemories.map((pm: any) => {
      const project = projects.find((p: any) => p.id === pm.projectId)
      return {
        projectId: pm.projectId,
        projectName: project?.name || 'Unknown Project',
        memoryCount: pm._count.id,
      }
    })

    // Get recent memory creation activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentMemories = await prisma.projectMemory.findMany({
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    // Get daily memory creation counts for the last 7 days
    const dailyMemoryCounts = await prisma.projectMemory.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    })

    // Process daily counts into a more usable format
    const dailyStats = dailyMemoryCounts.reduce((acc: Record<string, number>, item: any) => {
      const date = item.createdAt.toISOString().split('T')[0] // Get YYYY-MM-DD
      acc[date] = (acc[date] || 0) + item._count.id
      return acc
    }, {} as Record<string, number>)

    return Response.json({
      overview: {
        totalMemoriesCreated: memoryStats.memoryCount,
        dailyMemoriesCreated: memoryStats.dailyMemoryCount,
        dailyMemoryLimit: memoryStats.dailyMemoryLimit,
        totalProjects: projectMemoryStats.length,
      },
      projectBreakdown: projectMemoryStats,
      recentActivity: recentMemories,
      dailyStats,
      userId,
    })
  } catch (error) {
    console.error("Error fetching memory analytics:", error)
    return Response.json({ error: "Failed to fetch memory analytics" }, { status: 500 })
  }
} 