import { tool } from 'ai'
import { z } from 'zod'
import { auth } from '@/lib/auth/config'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { incrementMemoryUsage } from '@/lib/usage'

/**
 * Tool for creating new general memories
 */
export const createGeneralMemoryTool = tool({
  description: 'Create a new general memory for the user. Use this to store important information, insights, or context that is not specific to any project.',
  parameters: z.object({
    title: z.string().describe('A clear, descriptive title for the memory'),
    content: z.string().describe('The detailed content/description of the memory'),
    summary: z.string().optional().describe('A brief summary of the memory (optional)'),
    tags: z.array(z.string()).optional().describe('Tags to categorize the memory (optional)'),
    importance: z.number().min(1).max(10).default(5).describe('Importance level from 1-10, where 10 is most important'),
  }),
  execute: async ({ title, content, summary, tags, importance }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to create memories')
      }

      // Create the general memory
      const memory = await prisma.memory.create({
        data: {
          title,
          content,
          summary: summary || null,
          tags: tags ? JSON.stringify(tags) : null,
          importance: importance || 5,
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
      })

      // Increment memory usage tracking
      await incrementMemoryUsage(session.user.id)

      return {
        success: true,
        memory: {
          ...memory,
          tags: memory.tags ? JSON.parse(memory.tags) : null,
        },
        message: `Successfully created general memory "${title}"`,
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
 * Tool for retrieving all general memories
 */
export const getGeneralMemoriesTool = tool({
  description: 'Retrieve all general memories for the user. Use this to access stored information and context that is not tied to any specific project.',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to access memories')
      }

      // Get general memories for the user
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
          { importance: 'desc' },
          { updatedAt: 'desc' }
        ],
      })

      // Parse tags for each memory
      const memoriesWithParsedTags = memories.map((memory: any) => ({
        ...memory,
        tags: memory.tags ? JSON.parse(memory.tags) : null,
      }))

      return {
        success: true,
        memories: memoriesWithParsedTags,
        count: memories.length,
        message: `Retrieved ${memories.length} general memories`,
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
 * Tool for updating an existing general memory
 */
export const updateGeneralMemoryTool = tool({
  description: 'Update an existing general memory. Use this to modify or enhance stored information.',
  parameters: z.object({
    memoryId: z.string().describe('The ID of the memory to update'),
    title: z.string().optional().describe('New title for the memory (optional)'),
    content: z.string().optional().describe('New content for the memory (optional)'),
    summary: z.string().optional().describe('New summary for the memory (optional)'),
    tags: z.array(z.string()).optional().describe('New tags for the memory (optional)'),
    importance: z.number().min(1).max(10).optional().describe('New importance level from 1-10 (optional)'),
  }),
  execute: async ({ memoryId, title, content, summary, tags, importance }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to update memories')
      }

      // Verify the user owns this memory
      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
        select: { userId: true, title: true },
      })

      if (!memory) {
        throw new Error('Memory not found')
      }

      if (memory.userId !== session.user.id) {
        throw new Error('You do not have permission to update this memory')
      }

      // Update the memory
      const updatedMemory = await prisma.memory.update({
        where: { id: memoryId },
        data: {
          title: title || undefined,
          content: content || undefined,
          summary: summary !== undefined ? summary : undefined,
          tags: tags !== undefined ? (tags ? JSON.stringify(tags) : null) : undefined,
          importance: importance !== undefined ? importance : undefined,
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
      })

      return {
        success: true,
        memory: {
          ...updatedMemory,
          tags: updatedMemory.tags ? JSON.parse(updatedMemory.tags) : null,
        },
        message: `Successfully updated memory "${updatedMemory.title}"`,
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
 * Tool for deleting a general memory
 */
export const deleteGeneralMemoryTool = tool({
  description: 'Delete a general memory. Use this to remove outdated or incorrect information.',
  parameters: z.object({
    memoryId: z.string().describe('The ID of the memory to delete'),
  }),
  execute: async ({ memoryId }) => {
    try {
      // Get the current session directly
      const session = await auth.api.getSession({
        headers: await headers(),
      })

      if (!session?.user?.id) {
        throw new Error('User must be authenticated to delete memories')
      }

      // Verify the user owns this memory
      const memory = await prisma.memory.findUnique({
        where: { id: memoryId },
        select: { userId: true, title: true },
      })

      if (!memory) {
        throw new Error('Memory not found')
      }

      if (memory.userId !== session.user.id) {
        throw new Error('You do not have permission to delete this memory')
      }

      // Delete the memory
      await prisma.memory.delete({
        where: { id: memoryId },
      })

      return {
        success: true,
        message: `Successfully deleted memory "${memory.title}"`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  },
}) 