import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/service"

export async function POST(request: Request) {
  try {
    console.log("[v0] Atualizando fluxo de agentes...")
    const { flowConfig } = await request.json()

    if (!flowConfig || typeof flowConfig !== "object") {
      return NextResponse.json({ error: "Configuração de fluxo inválida" }, { status: 400 })
    }

    const supabase = createClient()

    // Primeiro, limpa todos os next_agent_id
    const { error: clearError } = await supabase.from("agents").update({ next_agent_id: null }).not("id", "is", null)

    if (clearError) {
      console.error("[v0] Erro ao limpar fluxos:", clearError)
      throw clearError
    }

    // Depois, atualiza com as novas configurações
    const updates = Object.entries(flowConfig).map(([agentId, nextAgentId]) => ({
      id: agentId,
      next_agent_id: nextAgentId === "none" || !nextAgentId ? null : nextAgentId,
    }))

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("agents")
        .update({ next_agent_id: update.next_agent_id })
        .eq("id", update.id)

      if (updateError) {
        console.error(`[v0] Erro ao atualizar agente ${update.id}:`, updateError)
        throw updateError
      }
    }

    console.log("[v0] Fluxo atualizado com sucesso!")

    return NextResponse.json({
      success: true,
      message: "Fluxo de agentes atualizado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Erro ao atualizar fluxo:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar fluxo" },
      { status: 500 },
    )
  }
}
