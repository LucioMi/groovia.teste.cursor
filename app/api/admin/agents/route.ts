import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { createServerClient } from "@/lib/supabase/server"

async function checkSuperAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).single()

  return roleData?.role === "super_admin"
}

export async function GET() {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[v0] Fetching agents from database...")

    const { data: agents, error } = await supabaseAdmin
      .from("agents")
      .select(`
        id,
        name,
        description,
        status,
        category,
        system_prompt,
        openai_assistant_id,
        openai_vector_store_id,
        next_agent_id,
        icon_color,
        organization_id,
        created_at,
        updated_at,
        organizations(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching agents:", error.message)
      throw error
    }

    const agentsWithCount = await Promise.all(
      (agents || []).map(async (agent) => {
        const { count } = await supabaseAdmin
          .from("conversations")
          .select("*", { count: "exact", head: true })
          .eq("agent_id", agent.id)

        return {
          ...agent,
          organization_name: agent.organizations?.name || null,
          conversation_count: count || 0,
        }
      }),
    )

    console.log(`[v0] Found ${agentsWithCount.length} agents`)

    return NextResponse.json({ agents: agentsWithCount })
  } catch (error) {
    console.error("[v0] Error fetching agents:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, status, organizationId, category = "custom" } = body

    if (!name) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    console.log("[v0] Creating new agent:", name)

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .insert({
        name,
        description,
        status: status || "active",
        organization_id: organizationId,
        category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    console.log("[v0] Agent created:", agent.id)

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating agent:", error)
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 })
  }
}
