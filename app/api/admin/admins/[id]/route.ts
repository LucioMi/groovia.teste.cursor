import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await checkAdminAccess()
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(params.id)

    if (userError || !userData) {
      return NextResponse.json({ error: "Administrador não encontrado" }, { status: 404 })
    }

    const { data: membership } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        role,
        organizations (
          name
        )
      `,
      )
      .eq("user_id", params.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Administrador não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      admin: {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.full_name,
        role: membership.role,
        organization_name: membership.organizations?.name,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar administrador:", error)
    return NextResponse.json({ error: "Erro ao buscar administrador" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await checkAdminAccess()
    if (!adminId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, role } = body

    if (email || name) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        email: email?.toLowerCase(),
        user_metadata: { full_name: name },
      })

      if (updateError) throw updateError
    }

    if (role && ["owner", "admin", "member", "viewer"].includes(role)) {
      await supabaseAdmin.from("organization_memberships").update({ role }).eq("user_id", params.id)
    }

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(params.id)

    const { data: membership } = await supabaseAdmin
      .from("organization_memberships")
      .select("role")
      .eq("user_id", params.id)
      .single()

    return NextResponse.json({
      admin: {
        id: userData?.user.id,
        email: userData?.user.email,
        name: userData?.user.user_metadata?.full_name,
        role: membership?.role,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao atualizar administrador:", error)
    return NextResponse.json({ error: "Erro ao atualizar administrador" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const currentAdminId = await checkAdminAccess()
    if (!currentAdminId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (currentAdminId === params.id) {
      return NextResponse.json({ error: "Você não pode deletar sua própria conta" }, { status: 400 })
    }

    const { count } = await supabaseAdmin
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner")

    if ((count || 0) <= 1) {
      return NextResponse.json({ error: "Não é possível deletar o último owner" }, { status: 400 })
    }

    await supabaseAdmin.from("organization_memberships").delete().eq("user_id", params.id)

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro ao deletar administrador:", error)
    return NextResponse.json({ error: "Erro ao deletar administrador" }, { status: 500 })
  }
}
