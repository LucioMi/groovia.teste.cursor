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

    console.log("[v0] Fetching subscriptions from database...")

    const { data: subscriptions, error } = await supabaseAdmin
      .from("organization_subscriptions")
      .select(`
        *,
        organizations(name, slug),
        subscription_plans(name, price_in_cents)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedSubscriptions = subscriptions?.map((sub) => ({
      ...sub,
      organization_name: sub.organizations?.name || null,
      organization_slug: sub.organizations?.slug || null,
      plan_name: sub.subscription_plans?.name || null,
      price_in_cents: sub.subscription_plans?.price_in_cents || 0,
    }))

    console.log(`[v0] Found ${formattedSubscriptions?.length || 0} subscriptions`)

    return NextResponse.json({ subscriptions: formattedSubscriptions || [] })
  } catch (error) {
    console.error("[v0] Error fetching subscriptions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch subscriptions" },
      { status: 500 },
    )
  }
}
