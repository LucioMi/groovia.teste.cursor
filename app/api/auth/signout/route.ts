import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Fazer logout no Supabase Auth
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[v0] Erro ao fazer logout no Supabase:", error)
      throw error
    }

    console.log("[v0] Logout realizado com sucesso")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Erro no logout:", error)
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 })
  }
}
