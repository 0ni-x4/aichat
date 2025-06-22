import { auth } from "@/lib/auth/config"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { MemoriesManager } from "./memories-manager"

type Props = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectMemoriesPage({ params }: Props) {
  const { projectId } = await params

  // Get the current session
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect("/auth")
  }

  // Verify the user owns this project and get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      userId: true,
    },
  })

  if (!project) {
    redirect("/")
  }

  if (project.userId !== session.user.id) {
    redirect("/")
  }

  // Get memories for this project
  const memories = await prisma.projectMemory.findMany({
    where: {
      projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      tags: true,
      importance: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { importance: "desc" },
      { updatedAt: "desc" }
    ],
  })

  // Parse tags for each memory
  const memoriesWithParsedTags = memories.map((memory: any) => ({
    ...memory,
    tags: memory.tags ? JSON.parse(memory.tags) : null,
  }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <a href={`/p/${projectId}`} className="hover:text-foreground">
            {project.name}
          </a>
          <span>/</span>
          <span>Memories</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Project Memories</h1>
        <p className="text-muted-foreground mt-2">
          Manage important information, insights, and context for this project.
        </p>
      </div>

      <MemoriesManager 
        projectId={projectId}
        projectName={project.name}
        initialMemories={memoriesWithParsedTags}
      />
    </div>
  )
} 