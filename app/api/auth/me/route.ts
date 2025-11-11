import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("selected_organization_id")
      .eq("user_id", user.id)
      .single()

    let organizationData = null
    if (preferences?.selected_organization_id) {
      const { data: orgs } = await supabaseAdmin
        .from("organizations")
        .select(
          `
          id,
          name,
          plan_type,
          organization_memberships!inner (
            role
          )
        `,
        )
        .eq("id", preferences.selected_organization_id)
        .eq("organization_memberships.user_id", user.id)
        .single()

      if (orgs) {
        organizationData = {
          id: orgs.id,
          name: orgs.name,
          plan: orgs.plan_type,
          role: orgs.organization_memberships[0]?.role,
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
      },
      organization: organizationData,
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
