import { logger } from "./logger"

interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

// Placeholder - em produção, usar Resend, SendGrid, etc
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    logger.info("Sending email", {
      to: options.to,
      subject: options.subject,
    })

    // Simulação - em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.log("=".repeat(60))
      console.log("EMAIL SIMULADO")
      console.log("=".repeat(60))
      console.log(`Para: ${options.to}`)
      console.log(`Assunto: ${options.subject}`)
      console.log(`Texto: ${options.text || options.html}`)
      console.log("=".repeat(60))
      return true
    }

    // TODO: Implementar com provedor real
    // Exemplo com Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@groovia.com',
    //   ...options
    // })

    return true
  } catch (error) {
    logger.error("Failed to send email", error as Error, { to: options.to })
    return false
  }
}

// Email de boas-vindas
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Bem-vindo ao GrooveIA!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Bem-vindo, ${name}!</h1>
        <p>Estamos felizes em tê-lo conosco no GrooveIA.</p>
        <p>Comece criando seu primeiro agente de IA e explore todas as funcionalidades da plataforma.</p>
        <p>Se tiver dúvidas, nossa equipe de suporte está sempre disponível.</p>
        <p>Atenciosamente,<br>Equipe GrooveIA</p>
      </div>
    `,
  })
}

// Email de recuperação de senha
export async function sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`

  return sendEmail({
    to,
    subject: "Recuperação de Senha - GrooveIA",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Recuperação de Senha</h1>
        <p>Olá ${name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #8B5CF6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          ">
            Redefinir Senha
          </a>
        </p>
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="color: #666; font-size: 14px;">${resetUrl}</p>
        <p><strong>Este link expira em 1 hora.</strong></p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe GrooveIA</p>
      </div>
    `,
  })
}

// Email de código de verificação
export async function sendVerificationCodeEmail(to: string, name: string, code: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Código de Verificação - GrooveIA",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Código de Verificação</h1>
        <p>Olá ${name},</p>
        <p>Use o código abaixo para verificar sua identidade:</p>
        <div style="
          background: #f3f4f6;
          padding: 20px;
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          margin: 20px 0;
          border-radius: 8px;
        ">
          ${code}
        </div>
        <p><strong>Este código expira em 10 minutos.</strong></p>
        <p>Se você não solicitou este código, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe GrooveIA</p>
      </div>
    `,
  })
}

// Email de nova organização
export async function sendOrganizationInviteEmail(
  to: string,
  organizationName: string,
  inviterName: string,
  inviteUrl: string,
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Convite para ${organizationName} - GrooveIA`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Você foi convidado!</h1>
        <p>${inviterName} convidou você para se juntar à organização <strong>${organizationName}</strong> no GrooveIA.</p>
        <p>
          <a href="${inviteUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #8B5CF6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
          ">
            Aceitar Convite
          </a>
        </p>
        <p>Atenciosamente,<br>Equipe GrooveIA</p>
      </div>
    `,
  })
}
