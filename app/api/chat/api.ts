import type {
  ChatApiParams,
  LogUserMessageParams,
  StoreAssistantMessageParams,
} from "@/app/types/api.types"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"
import { prisma } from "@/lib/prisma"

export async function validateAndTrackUsage({
  userId,
  model,
  isAuthenticated,
}: ChatApiParams): Promise<null> {
  // Check usage limits before processing
  await checkUsageByModel(userId, model, isAuthenticated)
  return null
}

export async function logUserMessage({
  userId,
  chatId,
  content,
  attachments,
  model,
  isAuthenticated,
}: LogUserMessageParams): Promise<void> {
  try {
    // Save user message to database
    await prisma.message.create({
      data: {
        chatId,
        userId,
        role: "user",
        content: typeof content === "string" ? content : JSON.stringify(content),
        experimentalAttachments: attachments ? JSON.stringify(attachments) : null,
      },
    })

    // Increment usage count
    await incrementUsageByModel(userId, model, isAuthenticated)
    
    console.log(`User message saved for chat ${chatId}`)
  } catch (error) {
    console.error("Error saving user message:", error)
  }
}

export async function storeAssistantMessage({
  chatId,
  messages,
}: StoreAssistantMessageParams): Promise<void> {
  try {
    // Find the assistant messages to save
    const assistantMessages = messages.filter(msg => msg.role === "assistant")
    
    if (assistantMessages.length === 0) {
      console.log("No assistant messages to save")
      return
    }

    // Save each assistant message
    for (const message of assistantMessages) {
      let content = ""
      let parts = null

      if (typeof message.content === "string") {
        content = message.content
      } else if (Array.isArray(message.content)) {
        // Extract text content and save parts separately
        const textParts = message.content
          .filter(part => part.type === "text")
          .map(part => part.text || "")
        content = textParts.join("\n\n")
        parts = JSON.stringify(message.content)
      }

      // Include tool invocations if present
      const messageAny = message as any
      if (messageAny.toolInvocations && messageAny.toolInvocations.length > 0) {
        const messageData = {
          content: content || "",
          toolInvocations: messageAny.toolInvocations,
        }
        parts = JSON.stringify(messageData)
      }

      await prisma.message.create({
        data: {
          chatId,
          role: "assistant",
          content: content || "",
          parts,
        },
      })
    }
    
    console.log(`Assistant messages saved for chat ${chatId}`)
  } catch (error) {
    console.error("Error saving assistant message:", error)
  }
}
