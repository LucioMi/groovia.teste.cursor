import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, isTokenExpired } from "@/lib/security"
import { resetPasswordSchema, validateInput } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { authRateLimit } from "@/lib/rate-limit"
import { supabaseAdmin } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.token && body.password) {
      await authRateLimit(request)

      const { token, password } = validateInput(resetPasswordSchema, body)

      // Buscar token
      const tokens = await sql`
        SELECT * FROM password_reset_tokens 
        WHERE token = ${token} 
        AND used = false
        LIMIT 1
      `

      if (tokens.length === 0) {
        return NextResponse.json({ error: "Token inválido ou já utilizado." }, { status: 400 })
      }

      const resetToken = tokens[0]

      // Verificar expiração
      if (isTokenExpired(new Date(resetToken.expires_at))) {
        await sql`
          UPDATE password_reset_tokens 
          SET used = true 
          WHERE id = ${resetToken.id}
        `

        return NextResponse.json({ error: "Token expirado. Solicite uma nova recuperação de senha." }, { status: 400 })
      }

      // Hash da nova senha
      const passwordHash = await hashPassword(password)

      // Atualizar senha do usuário
      await sql`
        UPDATE users 
        SET password = ${passwordHash}, updated_at = NOW()
        WHERE id = ${resetToken.user_id}
      `

      // Marcar token como usado
      await sql`
        UPDATE password_reset_tokens 
        SET used = true 
        WHERE id = ${resetToken.id}
      `

      // Invalidar todas as sessões do usuário (por segurança)
      await sql`
        DELETE FROM sessions WHERE user_id = ${resetToken.user_id}
      `

      logger.info("Password reset successfully", { userId: resetToken.user_id })

      return NextResponse.json({
        success: true,
        message: "Senha redefinida com sucesso. Faça login com sua nova senha.",
      })
    } else if (body.email) {
      const { email } = body

      if (!email) {
        return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }

      console.log("[v0] Enviando email de recuperação para:", email)

      // Enviar email de recuperação usando Supabase Auth
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/update-password`,
      })

      if (error) {
        console.error("[v0] Erro ao enviar email de recuperação:", error)
        throw error
      }

      console.log("[v0] Email de recuperação enviado com sucesso")

      return NextResponse.json({
        success: true,
        message: "Email de recuperação enviado com sucesso. Verifique sua caixa de entrada.",
      })
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
  } catch (error) {
    logger.error("Reset password error", error as Error)

    if (error instanceof Error && error.message.includes("Validação falhou")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    return NextResponse.json({ error: "Erro ao redefinir senha. Tente novamente." }, { status: 500 })
  }
}
