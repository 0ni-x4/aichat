import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { getProviderForModel } from "@/lib/openproviders/provider-map"
import type { ProviderWithoutOllama } from "@/lib/user-keys"
import { Attachment } from "@ai-sdk/ui-utils"
import { Message as MessageAISDK, streamText, NoSuchToolError, InvalidToolArgumentsError, ToolExecutionError } from "ai"
import {
  logUserMessage,
  storeAssistantMessage,
  validateAndTrackUsage,
} from "./api"
import { createErrorResponse, extractErrorMessage } from "./utils"
import { coreframeTools } from "@/tools"

interface ChatRequest {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt?: string
  enableSearch?: boolean
}

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      enableSearch,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    // No Supabase, so this returns null - we don't need it anymore
    await validateAndTrackUsage({
      userId,
      model,
      isAuthenticated,
    })

    const userMessage = messages[messages.length - 1]

    // Mock log user message (no database)
    if (userMessage?.role === "user") {
      await logUserMessage({
        userId,
        chatId,
        content: userMessage.content,
        attachments: userMessage.experimental_attachments as Attachment[],
        model,
        isAuthenticated,
      })
    }

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig || !modelConfig.apiSdk) {
      throw new Error(`Model ${model} not found`)
    }

    // Enhanced system prompt for AI SDK 5 tools
    const toolEnhancedPrompt = `${systemPrompt || SYSTEM_PROMPT_DEFAULT}

## Available Tools

You have access to comprehensive project and memory management tools with TWO types of memories:

### Project Memory Management (Project-Specific)
- **createMemory**: Store information specific to a project
- **getMemories**: Retrieve memories from a specific project
- **updateMemory**: Modify existing project memories
- **deleteMemory**: Remove outdated project memories

### General Memory Management (Personal/Non-Project)
- **createGeneralMemory**: Store personal information not tied to any project
- **getGeneralMemories**: Retrieve all general memories
- **updateGeneralMemory**: Modify existing general memories
- **deleteGeneralMemory**: Remove outdated general memories

### Project Management  
- **getProjects**: List all user projects
- **getProject**: Get detailed project information
- **createProject**: Create new projects to organize work
- **updateProject**: Modify project details

### Analytics & Context
- **getMemoryStats**: Check memory usage statistics
- **getMemoryAnalytics**: Get comprehensive memory analytics
- **getCurrentProjectContext**: Understand current project context

## Memory Usage Guidelines

1. **Always check project context first** using getCurrentProjectContext
2. **For project contexts**: Use project-specific memory tools (createMemory, getMemories, etc.)
3. **For general chats**: Use general memory tools (createGeneralMemory, getGeneralMemories, etc.)
4. **Personal information** (like user preferences, name, personal details): Store in general memories
5. **Project-specific information** (like project requirements, decisions, notes): Store in project memories
6. **Retrieve relevant memories** based on context:
   - In projects: Get project memories first, then general memories if relevant
   - In general chats: Use general memories
7. **Be proactive** in organizing information appropriately

## Context-Aware Memory Strategy

- **Project Context Detected**: Use project memory tools for project-related information
- **No Project Context**: Use general memory tools for personal information
- **User Personal Info**: Always use general memories (name, preferences, personal history)
- **Project Work**: Always use project memories (requirements, decisions, notes)

Remember: You are helping users build TWO organized knowledge bases - one for personal/general information and one for project-specific work.`

    let apiKey: string | undefined
    if (isAuthenticated && userId) {
      const { getEffectiveApiKey } = await import("@/lib/user-keys")
      const provider = getProviderForModel(model)
      apiKey =
        (await getEffectiveApiKey(userId, provider as any)) ||
        undefined
    }

    const result = streamText({
      model: modelConfig.apiSdk(apiKey, { enableSearch }),
      system: toolEnhancedPrompt,
      messages: messages,
      tools: coreframeTools,
      maxSteps: 10,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err)
        // Don't set streamError anymore - let the AI SDK handle it through the stream
      },

      onFinish: async ({ response }) => {
        // Mock store assistant message (no database)
        await storeAssistantMessage({
          chatId,
          messages:
            response.messages as unknown as import("@/app/types/api.types").Message[],
        })
      },
    })

    return result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
      getErrorMessage: (error: unknown) => {
        console.error("Error forwarded to client:", error)
        
        // Handle AI SDK 5 tool-specific errors
        if (NoSuchToolError.isInstance(error)) {
          return 'The AI tried to use a tool that is not available. Please try again.'
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          return 'The AI called a tool with invalid arguments. Please try rephrasing your request.'
        } else if (ToolExecutionError.isInstance(error)) {
          return 'A tool encountered an error during execution. Please try again.'
        }
        
        return extractErrorMessage(error)
      },
    })
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
