import { readFromIndexedDB, writeToIndexedDB } from "../persist"
import type { Chat, Chats } from "@/lib/chat-store/types"
import {
  API_ROUTE_UPDATE_CHAT_MODEL,
} from "../../routes"

// Client-side API that makes HTTP requests to server
export async function getChatsFromDb(userId: string) {
  try {
    // Make HTTP request to server API
    const response = await fetch(`/api/chats?userId=${userId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const chats = await response.json()
    
    // Cache the results
    await writeToIndexedDB("chats", { id: "all", chats })
    
    return chats
  } catch (error) {
    console.error("Failed to get chats from server:", error)
    // Fallback to cached data
    try {
      const cachedChats = await readFromIndexedDB("chats", "all") as { chats?: any[] } | null
      return cachedChats?.chats || []
    } catch (cacheError) {
      console.error("Failed to get cached chats:", error)
      return []
    }
  }
}

export async function deleteChatFromDb(id: string) {
  try {
    const response = await fetch(`/api/chats/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`Deleted chat ${id}`)
  } catch (error) {
    console.error(`Failed to delete chat ${id}:`, error)
  }
}

export async function getSharedChatsFromDb() {
  try {
    const response = await fetch('/api/chats/shared')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error("Failed to get shared chats:", error)
    return []
  }
}

export async function createChatInDb(
  userId: string,
  title: string,
  model: string,
  projectId?: string
) {
  try {
    // Use the existing create-chat API
    const response = await fetch('/api/create-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        model,
        isAuthenticated: true,
        projectId,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const chat = await response.json()

    const chatFormatted = {
      id: chat.id,
      title: chat.title || "New Chat",
      model: model || "",
      public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      project_id: projectId || null,
      user_id: userId,
    }

    // Update cache
    try {
      const cachedChats = await readFromIndexedDB("chats", "all") as { chats?: any[] } | null
      const existingChats = cachedChats?.chats || []
      const updatedChats = [chatFormatted, ...existingChats]
      await writeToIndexedDB("chats", { id: "all", chats: updatedChats })
    } catch (error) {
      console.error("Failed to cache new chat:", error)
    }

    return chatFormatted
  } catch (error) {
    console.error("Failed to create chat:", error)
    throw error
  }
}

export async function fetchAndCacheChats(userId: string): Promise<Chats[]> {
  const chats = await getChatsFromDb(userId)
  await writeToIndexedDB("chats", { id: "all", chats })
  return chats
}

export async function updateChatTitleInDb(id: string, title: string) {
  try {
    const response = await fetch(`/api/chats/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    console.log(`Updated chat ${id} title`)
  } catch (error) {
    console.error(`Failed to update chat ${id} title:`, error)
  }
}

export async function updateChatModelInDb(
  chatId: string,
  newModel: string
): Promise<boolean> {
  try {
    const response = await fetch(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model: newModel }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error("Error updating chat model:", error)
    return false
  }
}

// Additional functions expected by the provider
export async function getCachedChats(): Promise<Chats[]> {
  try {
    const cached = await readFromIndexedDB("chats", "all") as { chats?: Chats[] } | null
    return cached?.chats || []
  } catch (error) {
    console.error("Failed to get cached chats:", error)
    return []
  }
}

export async function createNewChat(
  userId: string,
  title?: string,
  model?: string,
  isAuthenticated?: boolean,
  projectId?: string
): Promise<Chats> {
  const chatData = await createChatInDb(userId, title || "New Chat", model || "gpt-4", projectId)
  return chatData as Chats
}

export async function deleteChat(id: string): Promise<void> {
  await deleteChatFromDb(id)
  
  // Update cache by removing the deleted chat
  try {
    const cachedChats = await readFromIndexedDB("chats", "all") as { chats?: Chats[] } | null
    if (cachedChats?.chats) {
      const updatedChats = cachedChats.chats.filter(chat => chat.id !== id)
      await writeToIndexedDB("chats", { id: "all", chats: updatedChats })
    }
  } catch (error) {
    console.error("Failed to update cache after delete:", error)
  }
}

export async function updateChatTitle(id: string, title: string): Promise<void> {
  await updateChatTitleInDb(id, title)
  
  // Update cache
  try {
    const cachedChats = await readFromIndexedDB("chats", "all") as { chats?: Chats[] } | null
    if (cachedChats?.chats) {
      const updatedChats = cachedChats.chats.map(chat => 
        chat.id === id ? { ...chat, title } : chat
      )
      await writeToIndexedDB("chats", { id: "all", chats: updatedChats })
    }
  } catch (error) {
    console.error("Failed to update cache after title change:", error)
  }
}

export async function updateChatModel(chatId: string, model: string): Promise<void> {
  const success = await updateChatModelInDb(chatId, model)
  
  if (success) {
    // Update cache
    try {
      const cachedChats = await readFromIndexedDB("chats", "all") as { chats?: Chats[] } | null
      if (cachedChats?.chats) {
        const updatedChats = cachedChats.chats.map(chat => 
          chat.id === chatId ? { ...chat, model } : chat
        )
        await writeToIndexedDB("chats", { id: "all", chats: updatedChats })
      }
    } catch (error) {
      console.error("Failed to update cache after model change:", error)
    }
  }
}
