import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getAssistant, isOpenAIConfigured } from "@/lib/openai-assistant"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: "OpenAI API key não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente." },
        { status: 400 },
      )
    }

    const { assistantId } = await request.json()

    if (!assistantId) {
      return NextResponse.json({ error: "Assistant ID is required" }, { status: 400 })
    }

    console.log("[v0] Linking assistant", assistantId, "to agent", agentId)

    // Verify the assistant exists in OpenAI
    const assistant = await getAssistant(assistantId)
    console.log("[v0] Assistant found:", assistant.name)

    // Update the agent with the assistant ID
    await sql`
      UPDATE agents 
      SET 
        openai_assistant_id = ${assistantId},
        openai_synced_at = NOW(),
        updated_at = NOW()
      WHERE id = ${agentId}
    `

    console.log("[v0] Agent updated successfully")

    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error linking assistant:", error)
    return NextResponse.json({ error: error.message || "Falha ao vincular assistente" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] Unlinking assistant from agent", agentId)

    // Unlink the assistant from the agent
    await sql`
      UPDATE agents 
      SET 
        openai_assistant_id = NULL,
        openai_thread_id = NULL,
        openai_synced_at = NULL,
        updated_at = NOW()
      WHERE id = ${agentId}
    `

    console.log("[v0] Assistant unlinked successfully")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error unlinking assistant:", error)
    return NextResponse.json({ error: error.message || "Falha ao desvincular assistente" }, { status: 500 })
  }
}
