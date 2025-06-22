import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"
import { checkMemoryUsage } from "@/lib/usage"

export async function GET(request: Request) {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get memory usage statistics
    const memoryStats = await checkMemoryUsage(session.user.id)

    return Response.json({
      totalMemoriesCreated: memoryStats.memoryCount,
      dailyMemoriesCreated: memoryStats.dailyMemoryCount,
      dailyMemoryLimit: memoryStats.dailyMemoryLimit,
      userId: session.user.id,
    })
  } catch (error) {
    console.error("Error fetching memory stats:", error)
    return Response.json({ error: "Failed to fetch memory statistics" }, { status: 500 })
  }
} 