import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/service"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Atualizando sequência de agentes")

    const { updates } = await request.json()

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Updates inválidos" }, { status: 400 })
    }

    console.log("[v0] Updates recebidos:", updates)

    const supabase = await createClient()

    // Atualizar cada agente individualmente
    for (const update of updates) {
      const { error } = await supabase
        .from("agents")
        .update({ next_agent_id: update.next_agent_id })
        .eq("id", update.id)

      if (error) {
        console.error("[v0] Erro ao atualizar agente:", update.id, error)
        throw error
      }

      console.log("[v0] Agente atualizado:", update.id, "→", update.next_agent_id)
    }

    console.log("[v0] Sequência atualizada com sucesso!")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao atualizar sequência:", error)
    return NextResponse.json({ error: "Erro ao atualizar sequência" }, { status: 500 })
  }
}
