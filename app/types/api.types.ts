import type { Attachment } from "@ai-sdk/ui-utils"

export interface ContentPart {
  type: string
  text?: string
  toolInvocation?: {
    toolCallId?: string
    toolName?: string
    args?: Record<string, unknown>
    result?: unknown
    state?: string
    step?: number
  }
  toolCallId?: string
  toolName?: string
  result?: unknown
  reasoning?: string
  details?: Array<{ type: string; text: string }>
}

export interface ChatApiParams {
  userId: string
  model: string
  isAuthenticated: boolean
}

export interface Message {
  role: "user" | "assistant" | "system" | "data" | "tool" | "tool-call"
  content: string | null | ContentPart[]
  reasoning?: string
}

// Updated interfaces without Supabase dependencies
export interface LogUserMessageParams {
  userId: string
  chatId: string
  content: string
  attachments?: Attachment[]
  model: string
  isAuthenticated: boolean
}

export interface StoreAssistantMessageParams {
  chatId: string
  messages: Message[]
}

export interface ApiErrorResponse {
  error: string
  details?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse 