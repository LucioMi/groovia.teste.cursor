import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

async function checkSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id).single()

  return roleData?.role === "super_admin"
}

export async function GET(request: Request) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const actionType = searchParams.get("actionType")
    const resourceType = searchParams.get("resourceType")
    const actorId = searchParams.get("actorId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("[v0] Fetching audit logs with filters:", { actionType, resourceType, actorId, limit, offset })

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (actionType && actionType !== "all") {
      query = query.eq("action_type", actionType)
    }

    if (resourceType && resourceType !== "all") {
      query = query.eq("resource_type", resourceType)
    }

    if (actorId) {
      query = query.eq("actor_id", actorId)
    }

    const { data: logs, error, count } = await query

    if (error) throw error

    console.log(`[v0] Found ${logs?.length || 0} audit logs (total: ${count})`)

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[v0] Error fetching audit logs:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch audit logs" },
      { status: 500 },
    )
  }
}
