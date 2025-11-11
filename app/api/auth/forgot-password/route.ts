import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generatePasswordResetToken, generateExpirationDate } from "@/lib/security"
import { resetPasswordRequestSchema, validateInput } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { sendPasswordResetEmail } from "@/lib/email"
import { authRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting rigoroso para prevenir abuso
    await authRateLimit(request)

    const body = await request.json()
    const { email } = validateInput(resetPasswordRequestSchema, body)

    // Buscar usuário
    const users = await sql`
      SELECT id, name, email FROM users 
      WHERE email = ${email.toLowerCase()} 
      AND deleted_at IS NULL
    `

    // Sempre retornar sucesso (não revelar se email existe)
    if (users.length === 0) {
      logger.info("Password reset requested for non-existent email", { email })
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      })
    }

    const user = users[0]

    // Gerar token de reset
    const resetToken = generatePasswordResetToken()
    const expiresAt = generateExpirationDate(1) // 1 hora

    // Invalidar tokens anteriores
    await sql`
      UPDATE password_reset_tokens 
      SET used = true 
      WHERE user_id = ${user.id} 
      AND used = false
    `

    // Criar novo token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `

    // Enviar email (não-bloqueante)
    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
      logger.error("Failed to send password reset email", err),
    )

    logger.info("Password reset token created", { userId: user.id })

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
    })
  } catch (error) {
    logger.error("Forgot password error", error as Error)

    if (error instanceof Error && error.message.includes("Rate limit")) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    return NextResponse.json({ error: "Erro ao processar solicitação. Tente novamente." }, { status: 500 })
  }
}
