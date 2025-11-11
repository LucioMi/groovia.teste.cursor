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

export async function GET(request: Request) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[v0] Fetching users from database...")
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    let query = supabaseAdmin.from("organization_memberships").select(`
        user_id,
        role,
        organization_id,
        organizations(name, slug),
        created_at
      `)

    if (search) {
      query = query.ilike("user_id", `%${search}%`)
    }

    const { data: memberships, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    // Get user details from auth.users via Supabase Admin
    const userIds = [...new Set(memberships?.map((m) => m.user_id) || [])]
    const usersWithDetails = await Promise.all(
      userIds.map(async (userId) => {
        const {
          data: { user },
        } = await supabaseAdmin.auth.admin.getUserById(userId)
        const membership = memberships?.find((m) => m.user_id === userId)

        return {
          id: userId,
          email: user?.email || "Unknown",
          name: user?.user_metadata?.name || user?.user_metadata?.full_name || null,
          role: membership?.role || null,
          organization_id: membership?.organization_id || null,
          organization_name: (membership?.organizations as any)?.name || null,
          organization_slug: (membership?.organizations as any)?.slug || null,
          created_at: user?.created_at || membership?.created_at || new Date().toISOString(),
          updated_at: user?.updated_at || new Date().toISOString(),
        }
      }),
    )

    console.log(`[v0] Found ${usersWithDetails.length} users`)
    return NextResponse.json({ users: usersWithDetails })
  } catch (error) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const isSuperAdmin = await checkSuperAdmin()
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, organizationId, role = "member", password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name || email.split("@")[0],
      },
    })

    if (authError) throw authError

    // Add user to organization if provided
    if (organizationId && authData.user) {
      const { error: membershipError } = await supabaseAdmin.from("organization_memberships").insert({
        organization_id: organizationId,
        user_id: authData.user.id,
        role,
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

      if (membershipError) throw membershipError
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata.name,
          created_at: authData.user.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user", details: String(error) }, { status: 500 })
  }
}
