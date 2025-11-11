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

    console.log("[v0] Buscando estatísticas do admin")

    // Get total organizations
    const { count: totalOrganizations } = await supabaseAdmin
      .from("organizations")
      .select("*", { count: "exact", head: true })

    // Get total users from auth
    const { count: totalUsers } = await supabaseAdmin
      .from("organization_memberships")
      .select("user_id", { count: "exact", head: true })

    // Get total agents
    const { count: totalAgents } = await supabaseAdmin
      .from("agents")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Get sessions this month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { count: totalSessions } = await supabaseAdmin
      .from("agent_sessions")
      .select("*", { count: "exact", head: true })
      .gte("started_at", firstDayOfMonth.toISOString())

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    // Calculate MRR
    const { data: subscriptions } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("plan_id, subscription_plans(price_in_cents)")
      .eq("status", "active")

    let monthlyRevenue = 0
    if (subscriptions) {
      monthlyRevenue =
        subscriptions.reduce((sum, sub: any) => {
          return sum + (sub.subscription_plans?.price_in_cents || 0)
        }, 0) / 100
    }

    // Calculate growth rate
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const { count: lastMonthOrgs } = await supabaseAdmin
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .lt("created_at", firstDayOfMonth.toISOString())

    const growthRate =
      lastMonthOrgs && lastMonthOrgs > 0 ? (((totalOrganizations || 0) - lastMonthOrgs) / lastMonthOrgs) * 100 : 0

    console.log("[v0] Estatísticas carregadas com sucesso")

    return NextResponse.json({
      totalOrganizations: totalOrganizations || 0,
      totalUsers: totalUsers || 0,
      totalAgents: totalAgents || 0,
      totalSessions: totalSessions || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue,
      growthRate: Number(growthRate.toFixed(1)),
    })
  } catch (error) {
    console.error("[v0] Erro ao carregar estatísticas:", error)
    return NextResponse.json({ error: "Erro ao carregar estatísticas" }, { status: 500 })
  }
}
