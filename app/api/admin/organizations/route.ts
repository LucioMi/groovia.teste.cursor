import { type NextRequest, NextResponse } from "next/server"
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

export async function GET(request: NextRequest) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[v0] Fetching organizations from database...")
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    let query = supabaseAdmin.from("organizations").select(`
        *,
        organization_memberships(count)
      `)

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    const { data: organizations, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    const formattedOrgs = organizations?.map((org) => ({
      ...org,
      member_count: org.organization_memberships?.[0]?.count || 0,
    }))

    console.log(`[v0] Found ${formattedOrgs?.length || 0} organizations`)
    return NextResponse.json({ organizations: formattedOrgs || [] })
  } catch (error) {
    console.error("[v0] Error fetching organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, plan_type = "free" } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Check if slug exists
    const { data: existing } = await supabaseAdmin.from("organizations").select("id").eq("slug", slug).single()

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    // Create organization
    const { data: organization, error } = await supabaseAdmin
      .from("organizations")
      .insert({
        name,
        slug,
        plan_type,
        plan_status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ organization }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating organization:", error)
    return NextResponse.json({ error: "Failed to create organization", details: String(error) }, { status: 500 })
  }
}
