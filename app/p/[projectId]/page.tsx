import { LayoutApp } from "@/app/components/layout/layout-app"
import { ProjectView } from "@/app/p/[projectId]/project-view"
import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ projectId: string }>
}

export default async function Page({ params }: Props) {
  const { projectId } = await params

  // Use Better Auth to get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect("/auth")
  }

  // Verify the project belongs to the user
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true, name: true },
    })

    if (!project || project.userId !== session.user.id) {
      redirect("/")
    }
  } catch (error) {
    console.error("Error fetching project:", error)
    redirect("/")
  }

  return (
    <LayoutApp>
      <ProjectView projectId={projectId} key={projectId} />
    </LayoutApp>
  )
}
