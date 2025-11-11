import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Senha é obrigatória" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 })
    }

    const supabase = await createClient()

    // Atualizar senha do usuário
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      console.error("[v0] Erro ao atualizar senha:", error)
      throw error
    }

    console.log("[v0] Senha atualizada com sucesso")

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com sucesso. Você já pode fazer login.",
    })
  } catch (error) {
    console.error("[v0] Erro ao atualizar senha:", error)
    return NextResponse.json({ error: "Erro ao atualizar senha. Tente novamente." }, { status: 500 })
  }
}
