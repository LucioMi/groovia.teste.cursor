import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha obrigatórios" }, { status: 400 })
    }

    console.log("[v0] Tentando login para:", email)

    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password,
    })

    if (authError) {
      console.error("[v0] Erro no login:", authError)
      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json(
          {
            error: "Email não verificado. Por favor, verifique sua caixa de entrada e confirme seu email.",
            code: "EMAIL_NOT_CONFIRMED",
          },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
    }

    const userId = authData.user.id
    console.log("[v0] Usuário logado:", userId)

    const { data: roleData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).maybeSingle()

    if (roleData?.role === "super_admin") {
      console.log("[v0] Super admin detectado!")
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: authData.user.email,
          name: authData.user.user_metadata?.full_name,
        },
        role: "super_admin",
        redirectTo: "/admin",
      })
    }

    const { data: memberships } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        *,
        organizations (
          id,
          name,
          plan_type
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)

    let selectedOrgId = null
    let role = "viewer"
    let orgName = null

    if (memberships && memberships.length > 0) {
      selectedOrgId = memberships[0].organization_id
      role = memberships[0].role
      orgName = (memberships[0].organizations as any)?.name

      console.log("[v0] Role do usuário:", role)

      await supabaseAdmin
        .from("user_preferences")
        .upsert({
          user_id: userId,
          selected_organization_id: selectedOrgId,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    }

    console.log("[v0] Login bem-sucedido! Role:", role)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: authData.user.email,
        name: authData.user.user_metadata?.full_name,
      },
      organization: selectedOrgId
        ? {
            id: selectedOrgId,
            name: orgName,
            role: role,
          }
        : null,
      role: role,
      redirectTo: "/dashboard/empresa",
    })
  } catch (error) {
    console.error("[v0] Erro no signin:", error)
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 })
  }
}
