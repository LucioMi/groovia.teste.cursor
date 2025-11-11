import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"
import crypto from "crypto"

async function checkAdminAccess(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: memberships } = await supabaseAdmin
    .from("organization_memberships")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .single()

  return memberships ? user.id : null
}

export async function GET() {
  try {
    const adminId = await checkAdminAccess()
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) throw usersError

    const { data: memberships } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        user_id,
        role,
        created_at,
        joined_at,
        organizations (
          name
        )
      `,
      )
      .in("role", ["owner", "admin"])

    const admins = usersData.users
      .map((user) => {
        const membership = memberships?.find((m) => m.user_id === user.id)
        if (!membership) return null

        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name,
          role: membership.role,
          organization_name: membership.organizations?.name,
          created_at: membership.created_at,
          joined_at: membership.joined_at,
        }
      })
      .filter(Boolean)

    return NextResponse.json({ admins })
  } catch (error) {
    console.error("[v0] Erro ao buscar administradores:", error)
    return NextResponse.json({ error: "Erro ao buscar administradores" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await checkAdminAccess()
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { email, name, organizationId, role, password } = await request.json()

    if (!email || !name || !organizationId || !password) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
    })

    if (authError) {
      console.error("[v0] Erro ao criar usuário:", authError)
      throw authError
    }

    const userId = authData.user.id

    await supabaseAdmin.from("organization_memberships").insert({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      user_id: userId,
      role: role || "admin",
      joined_at: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        admin: { id: userId, email, name, role: role || "admin" },
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("[v0] Erro ao criar admin:", error)
    return NextResponse.json({ error: error.message || "Erro ao criar administrador" }, { status: 500 })
  }
}
