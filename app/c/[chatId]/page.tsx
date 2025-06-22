import { Chat } from "@/app/components/chat/chat"
import { LayoutApp } from "@/app/components/layout/layout-app"

type PageProps = {
  params: {
    chatId: string
  }
}

export default async function Page({ params }: PageProps) {
  const { chatId } = params

  return (
    <LayoutApp>
      <Chat chatId={chatId} />
    </LayoutApp>
  )
}
