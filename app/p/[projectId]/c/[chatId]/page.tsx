import { Chat } from "@/app/components/chat/chat"
import { LayoutApp } from "@/app/components/layout/layout-app"

type Props = {
  params: Promise<{ projectId: string; chatId: string }>
}

export default async function ProjectChatPage({ params }: Props) {
  const { projectId, chatId } = await params

  return (
    <LayoutApp>
      <Chat chatId={chatId} projectId={projectId} />
    </LayoutApp>
  )
} 