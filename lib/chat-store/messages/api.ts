import type { Message as MessageAISDK } from "ai"
import { readFromIndexedDB, writeToIndexedDB } from "../persist"

// Client-side API that makes HTTP requests to server
export async function getMessagesFromDb(
  chatId: string
): Promise<MessageAISDK[]> {
  try {
    // Make HTTP request to server API
    const response = await fetch(`/api/chats/${chatId}/messages`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const messages = await response.json()
    
    // Cache the results
    await writeToIndexedDB("messages", { id: chatId, messages })
    
    return messages
  } catch (error) {
    console.error("Failed to get messages from server:", error)
    // Fallback to cached data
    return await getCachedMessages(chatId)
  }
}

async function insertMessageToDb(chatId: string, message: MessageAISDK) {
  try {
    const response = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`Message saved to server for chat ${chatId}`)
  } catch (error) {
    console.error("Error saving message to server:", error)
  }
}

async function insertMessagesToDb(chatId: string, messages: MessageAISDK[]) {
  try {
    const response = await fetch(`/api/chats/${chatId}/messages/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`${messages.length} messages saved to server for chat ${chatId}`)
  } catch (error) {
    console.error("Error saving messages to server:", error)
  }
}

export async function getCachedMessages(chatId: string): Promise<MessageAISDK[]> {
  try {
    const cached = await readFromIndexedDB("messages", chatId) as { messages?: MessageAISDK[] } | null
    return cached?.messages || []
  } catch (error) {
    console.error("Failed to get cached messages:", error)
    return []
  }
}

export async function clearMessagesForChat(chatId: string): Promise<void> {
  try {
    // Clear from server
    const response = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`Cleared messages from server for chat ${chatId}`)
  } catch (error) {
    console.error("Error clearing messages from server:", error)
  }
  
  // Clear from cache
  await writeToIndexedDB("messages", { id: chatId, messages: [] })
}

export async function cacheMessages(
  chatId: string,
  messages: MessageAISDK[]
): Promise<void> {
  await writeToIndexedDB("messages", { id: chatId, messages })
}

export async function addMessage(
  chatId: string,
  message: MessageAISDK
): Promise<void> {
  // Save to server in background
  insertMessageToDb(chatId, message).catch(err => 
    console.error("Failed to save message to server:", err)
  )
  
  // Update cache immediately
  const current = await getCachedMessages(chatId)
  const updated = [...current, message]
  await writeToIndexedDB("messages", { id: chatId, messages: updated })
}

export async function setMessages(
  chatId: string,
  messages: MessageAISDK[]
): Promise<void> {
  // Save to server in background
  insertMessagesToDb(chatId, messages).catch(err => 
    console.error("Failed to save messages to server:", err)
  )
  
  // Update cache immediately
  await writeToIndexedDB("messages", { id: chatId, messages })
}

