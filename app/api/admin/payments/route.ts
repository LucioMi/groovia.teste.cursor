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

    console.log("[v0] Fetching payments from database...")

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select(`
        *,
        organizations(name, slug)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    const formattedPayments = payments?.map((payment) => ({
      ...payment,
      organization_name: payment.organizations?.name || null,
      organization_slug: payment.organizations?.slug || null,
    }))

    console.log(`[v0] Found ${formattedPayments?.length || 0} payments`)

    return NextResponse.json({ payments: formattedPayments || [] })
  } catch (error) {
    console.error("[v0] Error fetching payments:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch payments" },
      { status: 500 },
    )
  }
}
