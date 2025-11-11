import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName } = await request.json()

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 })
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ error: "Senha deve conter pelo menos uma letra maiúscula" }, { status: 400 })
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ error: "Senha deve conter pelo menos uma letra minúscula" }, { status: 400 })
    }

    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ error: "Senha deve conter pelo menos um número" }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: false, // Exigir confirmação de email
      user_metadata: {
        full_name: name,
      },
    })

    if (authError) {
      console.error("[v0] Erro ao criar usuário no Supabase Auth:", authError)
      if (authError.message.includes("already registered")) {
        return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 })
      }
      throw authError
    }

    const userId = authData.user.id

    // Criar slug da organização
    const orgSlug = organizationName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    const { data: existingOrg } = await supabaseAdmin.from("organizations").select("id").eq("slug", orgSlug).single()

    if (existingOrg) {
      return NextResponse.json({ error: "Nome de empresa já em uso. Por favor, escolha outro." }, { status: 409 })
    }

    const orgId = crypto.randomUUID()

    await supabaseAdmin.from("organizations").insert({
      id: orgId,
      name: organizationName,
      slug: orgSlug,
      plan_type: "free",
      plan_status: "active",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      max_agents: 3,
      max_conversations_per_month: 100,
      max_team_members: 1,
    })

    await supabaseAdmin.from("organization_memberships").insert({
      id: crypto.randomUUID(),
      organization_id: orgId,
      user_id: userId,
      role: "owner",
    })

    await supabaseAdmin.from("user_preferences").insert({
      user_id: userId,
      selected_organization_id: orgId,
    })

    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: emailLower,
    })

    if (emailError) {
      console.error("[v0] Erro ao enviar email de verificação:", emailError)
    }

    return NextResponse.json({
      success: true,
      needsEmailVerification: true,
      message: "Conta criada! Verifique seu email para confirmar.",
      user: {
        id: userId,
        email: emailLower,
        name: name,
      },
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: "Erro ao criar conta. Por favor, tente novamente." }, { status: 500 })
  }
}
