import { createServiceClient } from "@/lib/supabase/service"
import { supabaseAdmin } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[v0] [SERVER] === GET /api/agents/[id] ===")
    console.log("[v0] [SERVER] Agent ID:", id)

    const supabase = createServiceClient()
    console.log("[v0] [SERVER] Fetching agent with SERVICE ROLE...")

    const { data: agent, error } = await supabase.from("agents").select("*").eq("id", id).single()

    if (error) {
      console.error("[v0] [SERVER] Error fetching agent:", error)

      if (error.code === "PGRST116") {
        console.error("[v0] [SERVER] Agent not found (404)")
        return NextResponse.json({ error: "Agent not found" }, { status: 404 })
      }

      return NextResponse.json({ error: "Failed to fetch agent", details: error.message }, { status: 500 })
    }

    console.log("[v0] [SERVER] ✓ Agent found:", agent.name)
    console.log("[v0] [SERVER] === END GET /api/agents/[id] (SUCCESS) ===")
    return NextResponse.json(agent)
  } catch (error) {
    console.error("[v0] [SERVER] ❌ FATAL ERROR:", error)
    console.error("[v0] [SERVER] Stack:", error instanceof Error ? error.stack : "N/A")
    return NextResponse.json(
      {
        error: "Failed to fetch agent",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      category,
      status,
      icon_color,
      system_prompt,
      next_agent_id,
      is_passive,
      short_description,
    } = body

    const supabase = createServiceClient()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (icon_color !== undefined) updateData.icon_color = icon_color
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt
    if (next_agent_id !== undefined) updateData.next_agent_id = next_agent_id
    if (is_passive !== undefined) updateData.is_passive = is_passive
    if (short_description !== undefined) updateData.short_description = short_description
    updateData.updated_at = new Date().toISOString()

    const { data: agent, error } = await supabaseAdmin.from("agents").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] [SERVER] Error updating agent:", error)
      return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
    }

    console.log("[v0] [SERVER] Agent updated:", agent.id, "with next_agent_id:", agent.next_agent_id)

    return NextResponse.json({ agent })
  } catch (error) {
    console.error("[v0] [SERVER] Error updating agent:", error)
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabaseAdmin.from("agents").delete().eq("id", id)

    if (error) {
      console.error("[v0] [SERVER] Error deleting agent:", error)
      return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
    }

    return NextResponse.json({ message: "Agent deleted successfully" })
  } catch (error) {
    console.error("[v0] [SERVER] Error deleting agent:", error)
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 })
  }
}
