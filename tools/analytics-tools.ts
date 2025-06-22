import { tool } from 'ai'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { checkMemoryUsage } from '@/lib/usage'

/**
 * Tool for getting memory usage statistics
 */
export const getMemoryStatsTool = tool({
  description: 'Get memory usage statistics for the current user, including total and daily counts.',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access memory statistics')
      }

      // Get memory usage statistics
      const memoryStats = await checkMemoryUsage(session.user.id)

      return {
        success: true,
        stats: {
          totalMemoriesCreated: memoryStats.memoryCount,
          dailyMemoriesCreated: memoryStats.dailyMemoryCount,
          dailyMemoryLimit: memoryStats.dailyMemoryLimit,
          remainingDailyMemories: memoryStats.dailyMemoryLimit - memoryStats.dailyMemoryCount,
        },
        message: `You have created ${memoryStats.memoryCount} total memories, ${memoryStats.dailyMemoryCount} today`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  },
})

/**
 * Tool for getting comprehensive memory analytics
 */
export const getMemoryAnalyticsTool = tool({
  description: 'Get comprehensive memory analytics including project breakdown, recent activity, and trends.',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access memory analytics')
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

      // Get total project count
      const totalProjects = await prisma.project.count({
        where: { userId },
      })

      return {
        success: true,
        analytics: {
          overview: {
            totalMemoriesCreated: memoryStats.memoryCount,
            dailyMemoriesCreated: memoryStats.dailyMemoryCount,
            dailyMemoryLimit: memoryStats.dailyMemoryLimit,
            totalProjects: totalProjects,
            projectsWithMemories: projectMemoryStats.length,
          },
          projectBreakdown: projectMemoryStats,
          recentActivity: recentMemories,
          topProjects: projectMemoryStats
            .sort((a: any, b: any) => b.memoryCount - a.memoryCount)
            .slice(0, 5),
        },
        message: `Analytics: ${memoryStats.memoryCount} total memories across ${totalProjects} projects`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  },
})

/**
 * Tool for getting current project context
 */
export const getCurrentProjectContextTool = tool({
  description: 'Get the current project context based on the chat or conversation. Use this to understand which project we are working in.',
  parameters: z.object({
    chatId: z.string().optional().describe('The current chat ID to determine project context'),
  }),
  execute: async ({ chatId }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access project context')
      }

      let projectId: string | null = null
      let projectInfo = null

      // If we have a chatId, try to get the project from the chat
      if (chatId) {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          select: { projectId: true, userId: true },
        })

        if (chat && chat.userId === session.user.id) {
          projectId = chat.projectId
        }
      }

      // If we found a project, get its details
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            _count: {
              select: {
                memories: true,
                chats: true,
              },
            },
          },
        })

        if (project && project.userId === session.user.id) {
          projectInfo = {
            id: project.id,
            name: project.name,
            description: project.description,
            summary: project.summary,
            memoryCount: project._count.memories,
            chatCount: project._count.chats,
          }
        }
      }

      return {
        success: true,
        context: {
          hasProject: !!projectInfo,
          project: projectInfo,
          chatId: chatId || null,
        },
        message: projectInfo 
          ? `Currently in project "${projectInfo.name}" with ${projectInfo.memoryCount} memories`
          : 'No project context found - this is a general chat',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  },
}) 