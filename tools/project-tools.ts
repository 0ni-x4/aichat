import { tool } from 'ai'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

/**
 * Tool for getting user's projects
 */
export const getProjectsTool = tool({
  description: 'Get all projects for the current user. Use this to list available projects.',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access projects')
      }

      // Get projects for the user with stats
      const projects = await prisma.project.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          _count: {
            select: {
              memories: true,
              chats: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      })

      return {
        success: true,
        projects: projects.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          summary: project.summary,
          startDate: project.startDate,
          targetDate: project.targetDate,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          memoryCount: project._count.memories,
          chatCount: project._count.chats,
        })),
        count: projects.length,
        message: `Retrieved ${projects.length} projects`,
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
 * Tool for getting a specific project details
 */
export const getProjectTool = tool({
  description: 'Get detailed information about a specific project, including its memories and chats.',
  parameters: z.object({
    projectId: z.string().describe('The ID of the project to retrieve'),
  }),
  execute: async ({ projectId }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access project details')
      }

      // Get project with related data
      const project = await prisma.project.findUnique({
        where: { 
          id: projectId,
        },
        include: {
          _count: {
            select: {
              memories: true,
              chats: true,
            },
          },
          memories: {
            select: {
              id: true,
              title: true,
              summary: true,
              importance: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: [
              { importance: 'desc' },
              { updatedAt: 'desc' }
            ],
            take: 10, // Limit to most recent/important
          },
          chats: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              updatedAt: 'desc',
            },
            take: 5, // Limit to most recent
          },
        },
      })

      if (!project) {
        throw new Error('Project not found')
      }

      if (project.userId !== session.user.id) {
        throw new Error('You do not have permission to access this project')
      }

      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          summary: project.summary,
          startDate: project.startDate,
          targetDate: project.targetDate,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          memoryCount: project._count.memories,
          chatCount: project._count.chats,
          recentMemories: project.memories,
          recentChats: project.chats,
        },
        message: `Retrieved project "${project.name}" with ${project._count.memories} memories and ${project._count.chats} chats`,
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
 * Tool for creating a new project
 */
export const createProjectTool = tool({
  description: 'Create a new project. Use this to organize work and memories around a specific topic or goal.',
  parameters: z.object({
    name: z.string().describe('The name of the project'),
    description: z.string().optional().describe('A detailed description of the project'),
    summary: z.string().optional().describe('A brief summary of the project (max 255 chars)'),
    startDate: z.string().optional().describe('The start date of the project in ISO format'),
    targetDate: z.string().optional().describe('The target completion date in ISO format'),
  }),
  execute: async ({ name, description, summary, startDate, targetDate }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to create projects')
      }

      // Create the project
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
        },
      })

      return {
        success: true,
        project,
        message: `Successfully created project "${name}"`,
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
 * Tool for updating an existing project
 */
export const updateProjectTool = tool({
  description: 'Update an existing project\'s information.',
  parameters: z.object({
    projectId: z.string().describe('The ID of the project to update'),
    name: z.string().optional().describe('New name for the project'),
    description: z.string().optional().describe('New description for the project'),
    summary: z.string().optional().describe('New summary for the project'),
    startDate: z.string().optional().describe('New start date in ISO format'),
    targetDate: z.string().optional().describe('New target date in ISO format'),
  }),
  execute: async ({ projectId, name, description, summary, startDate, targetDate }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to update projects')
      }

      // Verify the user owns this project
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true, name: true },
      })

      if (!existingProject) {
        throw new Error('Project not found')
      }

      if (existingProject.userId !== session.user.id) {
        throw new Error('You do not have permission to update this project')
      }

      // Update the project
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: name || undefined,
          description: description !== undefined ? description : undefined,
          summary: summary !== undefined ? summary : undefined,
          startDate: startDate ? new Date(startDate) : undefined,
          targetDate: targetDate ? new Date(targetDate) : undefined,
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
        },
      })

      return {
        success: true,
        project: updatedProject,
        message: `Successfully updated project "${updatedProject.name}"`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  },
}) 