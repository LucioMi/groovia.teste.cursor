import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("[v0] Starting database seed...")

    // Check if agents already exist
    const existingAgents = await sql`SELECT COUNT(*) as count FROM agents`
    const count = Number.parseInt(existingAgents[0]?.count || "0")

    if (count > 0) {
      console.log(`[v0] Database already has ${count} agents, skipping seed`)
      return NextResponse.json({
        success: true,
        message: `Database already initialized with ${count} agents`,
        skipped: true,
      })
    }

    // Seed initial agents
    await sql`
      INSERT INTO agents (id, name, description, category, status, last_session, user_id, icon_color) VALUES
        ('agent-001', 'SCAN CLARITY', 'Tem como objetivo consolidar informações do cliente que preencheu a Scan Clarity, criando a DE-PARA e até 5 diretrizes estratégicas', 'Ato 01', 'active', NOW() - INTERVAL '2 days', 'system', '#7C3AED'),
        ('agent-002', 'Pesquisador de Mercado e ICP', 'Agente autônomo, tem como objetivo realizar uma profunda pesquisa de mercado e ICP com maior detalhamento com base no documento do cliente', 'Ato 01', 'active', NOW() - INTERVAL '2 days', 'system', '#10B981'),
        ('agent-003', 'Agente criador de Persona', 'Agente autônomo, realiza seu trabalho detalhado de criação de Persona avançado com base nos documentos anteriores do cliente', 'Ato 01', 'active', NOW() - INTERVAL '2 days', 'system', '#F59E0B'),
        ('agent-004', 'Agente de Estratégia Corporativa', 'Criar uma robusta e completa estratégia corporativa que seja o ponto de partida para planejamento Tático e Operacional se iniciarem', 'Ato 02', 'active', NOW() - INTERVAL '2 days', 'system', '#EF4444'),
        ('agent-005', 'Agente Projetista de DRE', 'Responsável por construir uma projeção DRE (financeiro) combinando com o plano estratégico realista para os próximos 5 anos', 'Ato 02', 'active', NOW() - INTERVAL '2 days', 'system', '#3B82F6'),
        ('agent-006', 'Agente Gerador de OKRs', 'Especialista em criação de OKRs para empresas com a entrega de Kit de implementação e Comunicação de OKRs', 'Ato 03', 'active', NOW() - INTERVAL '2 days', 'system', '#8B5CF6')
      ON CONFLICT (id) DO NOTHING
    `

    const newAgents = await sql`SELECT COUNT(*) as count FROM agents`
    const newCount = Number.parseInt(newAgents[0]?.count || "0")

    console.log(`[v0] Database seeded successfully with ${newCount} agents`)

    return NextResponse.json({
      success: true,
      message: `Database initialized with ${newCount} agents`,
      count: newCount,
    })
  } catch (error) {
    console.error("[v0] Error seeding database:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to seed database",
      },
      { status: 500 },
    )
  }
}
