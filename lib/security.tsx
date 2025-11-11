import crypto from "crypto"
import { logger } from "./logger"

// Gerar token seguro
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

// Gerar token de sessão
export function generateSessionToken(): string {
  return generateSecureToken(32)
}

// Gerar token de reset de senha
export function generatePasswordResetToken(): string {
  return generateSecureToken(32)
}

// Hash de senha com bcrypt
import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12) // 12 rounds é seguro
  return await bcrypt.hash(password, salt)
}

// Verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    logger.error("Password verification failed", error as Error)
    return false
  }
}

// Sanitizar HTML (prevenir XSS)
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

// Validar e sanitizar URL
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url)

    // Apenas permitir http e https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

// Gerar código de verificação (6 dígitos)
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Verificar se token expirou
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

// Gerar data de expiração
export function generateExpirationDate(hours: number): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

// Mascarar email para exibição
export function maskEmail(email: string): string {
  const [username, domain] = email.split("@")
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`
  }
  return `${username.slice(0, 2)}***${username.slice(-1)}@${domain}`
}

// Validar força da senha
export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Comprimento
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  else feedback.push("Use pelo menos 12 caracteres")

  // Complexidade
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  else feedback.push("Use letras maiúsculas e minúsculas")

  if (/[0-9]/.test(password)) score++
  else feedback.push("Inclua números")

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push("Inclua caracteres especiais (!@#$%^&*)")

  // Padrões comuns (penalizar)
  if (/^[0-9]+$/.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push("Não use apenas números")
  }

  if (/^[a-zA-Z]+$/.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push("Não use apenas letras")
  }

  // Sequências
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push("Evite caracteres repetidos")
  }

  return {
    score: Math.min(4, score),
    feedback: feedback.length === 0 ? ["Senha forte!"] : feedback,
  }
}

// Criar hash HMAC para webhooks
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

// Verificar signature de webhook
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createWebhookSignature(payload, secret)

  try {
    // Usar timingSafeEqual para prevenir timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    return false
  }
}

// Gerar CSRF token
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// Validar origem da requisição (CORS)
export function validateOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false

  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true
    if (allowed.includes("*")) {
      // Suportar wildcards como *.exemplo.com
      const regex = new RegExp("^" + allowed.replace(/\*/g, ".*") + "$")
      return regex.test(origin)
    }
    return origin === allowed
  })
}

// IP whitelisting (para rotas admin muito sensíveis)
export function isIPWhitelisted(ip: string, whitelist: string[]): boolean {
  return whitelist.includes(ip) || whitelist.includes("*")
}
