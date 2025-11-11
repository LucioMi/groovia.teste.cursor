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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .select(
        `
        *,
        organizations (name),
        agent_sessions (count)
      `,
      )
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching agent:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      agent: {
        ...agent,
        organization_name: agent.organizations?.name,
        conversation_count: agent.agent_sessions?.[0]?.count || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching agent:", error)
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, status, category, next_agent_id, system_prompt } = body

    const nextAgentIdValue = !next_agent_id || next_agent_id === "none" ? null : next_agent_id

    const { data: agent, error } = await supabaseAdmin
      .from("agents")
      .update({
        name,
        description,
        status,
        category,
        next_agent_id: nextAgentIdValue,
        system_prompt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating agent:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("[v0] Error updating agent:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabaseAdmin.from("agents").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting agent:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}
