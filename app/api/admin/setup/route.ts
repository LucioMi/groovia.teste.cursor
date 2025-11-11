import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Variáveis de ambiente do Supabase não configuradas")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin.from("user_roles").select("id").eq("role", "super_admin").limit(1)

    if (error) {
      console.error("[v0] Erro ao verificar admin:", error)
      return NextResponse.json(
        {
          error: "Erro ao verificar sistema",
          details: error.message,
        },
        { status: 500 },
      )
    }

    const hasAdmin = (data?.length || 0) > 0

    return NextResponse.json({
      needsSetup: !hasAdmin,
      hasAdmin: hasAdmin,
    })
  } catch (error) {
    console.error("[v0] Erro na API GET:", error)
    return NextResponse.json(
      {
        error: "Erro ao verificar sistema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, senha e nome são obrigatórios" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 })
    }

    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "super_admin")
      .limit(1)

    if (checkError) {
      console.error("[v0] Erro ao verificar admins existentes:", checkError)
      return NextResponse.json(
        {
          error: "Erro ao verificar sistema",
          details: checkError.message,
        },
        { status: 500 },
      )
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: "Já existe um administrador configurado" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        full_name: name,
      },
    })

    if (authError) {
      console.error("[v0] Erro ao criar usuário no Supabase Auth:", authError)
      return NextResponse.json(
        {
          error: "Erro ao criar usuário",
          details: authError.message,
        },
        { status: 500 },
      )
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Falha ao criar usuário" }, { status: 500 })
    }

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "super_admin",
    })

    if (roleError) {
      console.error("[v0] Erro ao adicionar role:", roleError)
      // Tentar deletar o usuário criado se falhar ao adicionar role
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        {
          error: "Erro ao configurar permissões",
          details: roleError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Administrador criado com sucesso! Faça login em /auth/signin",
      admin: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      },
    })
  } catch (error) {
    console.error("[v0] Erro na API POST:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar administrador",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
