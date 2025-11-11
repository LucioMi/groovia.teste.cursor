import { createServiceClient } from "@/lib/supabase/service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] [SERVER] === INICIANDO GET /api/agents ===")

  try {
    console.log("[v0] [SERVER] Criando cliente Supabase com SERVICE ROLE...")
    const supabase = createServiceClient()
    console.log("[v0] [SERVER] ✓ Cliente Supabase criado com SERVICE ROLE (bypass RLS)")

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    console.log("[v0] [SERVER] Filtros:", { status, category, search })
    console.log("[v0] [SERVER] Buscando TODOS os agentes (global access)...")

    let query = supabase.from("agents").select("*").order("created_at", { ascending: false })

    if (status) query = query.eq("status", status)
    if (category) query = query.eq("category", category)
    if (search) query = query.ilike("name", `%${search}%`)

    console.log("[v0] [SERVER] Executando query...")
    const { data: agents, error } = await query

    if (error) {
      console.error("[v0] [SERVER] ❌ Erro Supabase:", error)
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 })
    }

    console.log("[v0] [SERVER] ✓ Agentes encontrados:", agents?.length || 0)

    if (agents && agents.length > 0) {
      agents.forEach((agent, i) => {
        console.log(`[v0] [SERVER]   ${i + 1}. ${agent.name} (ID: ${agent.id}, next: ${agent.next_agent_id || "null"})`)
      })
    } else {
      console.log("[v0] [SERVER] ⚠️ NENHUM AGENTE ENCONTRADO")
    }

    console.log("[v0] [SERVER] === FIM GET /api/agents (SUCESSO) ===")
    return NextResponse.json({ agents: agents || [] })
  } catch (error) {
    console.error("[v0] [SERVER] ❌ ERRO FATAL:", error)
    console.error("[v0] [SERVER] Stack:", error instanceof Error ? error.stack : "N/A")

    return NextResponse.json(
      {
        error: "Failed to fetch agents",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, status, icon_color, system_prompt, next_agent_id } = body

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        name,
        description,
        category,
        status: status || "active",
        icon_color: icon_color || "#8B5CF6",
        system_prompt,
        next_agent_id: next_agent_id || null,
        organization_id: null,
        user_id: null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao criar agente:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}
