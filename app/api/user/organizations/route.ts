import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] User not authenticated:", authError?.message)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = user.id
    console.log("[v0] Fetching organizations for user:", userId)

    // Get user's current organization preference
    const { data: preference } = await supabaseAdmin
      .from("user_preferences")
      .select("selected_organization_id")
      .eq("user_id", userId)
      .single()

    // Get all organizations the user belongs to
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        role,
        organization_id,
        organizations (
          id,
          name,
          slug,
          plan_type
        )
      `,
      )
      .eq("user_id", userId)

    if (memberError) {
      console.error("[v0] Error fetching memberships:", memberError)
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
    }

    const organizations = (memberships || []).map((m: any) => ({
      id: m.organizations.id,
      name: m.organizations.name,
      slug: m.organizations.slug,
      plan_type: m.organizations.plan_type,
      role: m.role,
    }))

    // Determine current organization
    let current = null
    if (preference?.selected_organization_id) {
      current = organizations.find((org: any) => org.id === preference.selected_organization_id)
    }

    // If no preference or org not found, use first organization
    if (!current && organizations.length > 0) {
      current = organizations[0]

      // Save this as the preference
      await supabaseAdmin.from("user_preferences").upsert(
        {
          user_id: userId,
          selected_organization_id: current.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
    }

    console.log("[v0] Organizations loaded:", { userId, total: organizations.length, current: current?.name })

    return NextResponse.json({ organizations, current })
  } catch (error) {
    console.error("[v0] Error fetching organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}
