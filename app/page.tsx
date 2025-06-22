import { Chat } from "@/app/components/chat/chat"
import { LayoutApp } from "@/app/components/layout/layout-app"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <LayoutApp>
      <Chat />
    </LayoutApp>
  )
}
