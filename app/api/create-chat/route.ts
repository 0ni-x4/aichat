import { createChat } from "./api"

export async function POST(req: Request) {
  try {
    const { userId, title, model, isAuthenticated, projectId } = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const chat = await createChat({
      userId,
      title,
      model,
      isAuthenticated,
      projectId,
    })

    return new Response(JSON.stringify(chat), { status: 200 })
  } catch (err: unknown) {
    console.error("Error creating chat:", err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 }
    )
  }
}
