import { PROVIDERS } from "@/lib/providers"
import { auth } from "@/lib/auth/config"
import { headers } from "next/headers"

const SUPPORTED_PROVIDERS = PROVIDERS.map((p) => p.id)

export async function GET() {
  try {
    // Use Better Auth to get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Return all providers as false since we're not storing API keys
    const providerStatus = SUPPORTED_PROVIDERS.reduce(
      (acc, provider) => {
        acc[provider] = false
        return acc
      },
      {} as Record<string, boolean>
    )

    return Response.json(providerStatus)
  } catch (err) {
    console.error("Key status error:", err)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
