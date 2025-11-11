import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { getAssistant } from "@/lib/openai-assistant"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin (você pode adicionar um campo is_admin na tabela users)
    // Por enquanto vamos permitir qualquer usuário autenticado

    const { assistantId, category, nextAgentId } = await request.json()

    console.log("[v0] Importing OpenAI assistant:", assistantId)

    // Fetch assistant from OpenAI
    const assistant = await getAssistant(assistantId)

    if (!assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 })
    }

    // Get vector store ID if exists
    const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0]

    // Save agent to database
    const result = await sql`
      INSERT INTO agents (
        name, description, system_prompt, category, status,
        openai_assistant_id, openai_vector_store_id, next_agent_id,
        created_at, updated_at, openai_synced_at
      )
      VALUES (
        ${assistant.name}, ${assistant.description || ""}, ${assistant.instructions || ""}, ${category || "imported"}, 'active',
        ${assistantId}, ${vectorStoreId}, ${nextAgentId},
        NOW(), NOW(), NOW()
      )
      RETURNING *
    `

    const agent = result[0]
    console.log("[v0] Agent imported successfully:", agent.id)

    return NextResponse.json(agent)
  } catch (error: any) {
    console.error("[v0] Error importing assistant:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
