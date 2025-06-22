import { ProjectChat } from "@/app/components/chat/project-chat"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"

type Props = {
  params: Promise<{ projectId: string; chatId: string }>
}

export default async function ProjectChatPage({ params }: Props) {
  const { projectId, chatId } = await params

  return (
    <MessagesProvider>
      <LayoutApp>
        <ProjectChat projectId={projectId} chatId={chatId} />
      </LayoutApp>
    </MessagesProvider>
  )
} 