import { useChatDraft } from "@/app/hooks/use-chat-draft"
import { toast } from "@/components/ui/toast"
import { getOrCreateGuestUserId } from "@/lib/api"
import { MESSAGE_MAX_LENGTH, SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { Attachment } from "@/lib/file-handling"
import { API_ROUTE_CHAT } from "@/lib/routes"
import { useChat } from "@ai-sdk/react"
import type { Message } from "@ai-sdk/react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type UseChatCoreProps = {
  initialMessages: Message[]
  draftValue: string
  chatId: string | null
  user: any
  selectedModel: string
  clearDraft: () => void
  bumpChat: (chatId: string) => void
  projectId?: string
}

export function useChatCore({
  initialMessages,
  draftValue,
  chatId,
  user,
  selectedModel,
  clearDraft,
  bumpChat,
  projectId,
}: UseChatCoreProps) {
  const [enableSearch, setEnableSearch] = useState(false)
  const hasSentFirstMessageRef = useRef(false)
  const isAuthenticated = useMemo(() => !!user?.id, [user?.id])
  const systemPrompt = useMemo(
    () => user?.system_prompt || SYSTEM_PROMPT_DEFAULT,
    [user?.system_prompt]
  )
  const searchParams = useSearchParams()
  const prompt = searchParams.get("prompt")

  const handleError = useCallback((error: Error) => {
    toast({ title: error.message || "Something went wrong.", status: "error" })
  }, [])

  const {
    messages,
    input,
    handleSubmit,
    status,
    error,
    reload,
    stop,
    setMessages,
    setInput,
    append,
  } = useChat({
    api: API_ROUTE_CHAT,
    initialMessages,
    initialInput: draftValue,
    onFinish: () => {
      if (chatId) bumpChat(chatId)
      clearDraft()
    },
    onError: handleError,
    body: {
      chatId,
      userId: user?.id,
      model: selectedModel,
      isAuthenticated,
      systemPrompt: systemPrompt || SYSTEM_PROMPT_DEFAULT,
      enableSearch,
      projectId,
    },
  })

  const isSubmitting = useMemo(() => status === "submitted", [status])

  useEffect(() => {
    if (prompt && typeof window !== "undefined") {
      requestAnimationFrame(() => setInput(prompt))
    }
  }, [prompt, setInput])

  // Simplified submit action
  const submit = useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      handleSubmit(e)
    },
    [handleSubmit]
  )

  // Handle suggestion - simplified
  const handleSuggestion = useCallback(
    (suggestion: string) => {
      append({ role: "user", content: suggestion })
    },
    [append]
  )

  // Handle reload - simplified
  const handleReload = useCallback(() => {
    reload()
  }, [reload])

  // Handle input change
  const { setDraftValue } = useChatDraft(chatId)
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setDraftValue(value)
    },
    [setInput, setDraftValue]
  )

  return {
    messages,
    input,
    status,
    stop,
    isSubmitting,
    enableSearch,
    setEnableSearch,
    submit,
    handleSuggestion,
    handleReload,
    handleInputChange,
  }
}
