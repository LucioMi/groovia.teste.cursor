import type { NextRequest } from "next/server"

interface RateLimitConfig {
  interval: number // em ms
  uniqueTokenPerInterval: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// Store em memória (em produção, usar Redis/Upstash)
const store: RateLimitStore = {}

export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minuto
    uniqueTokenPerInterval: 10, // 10 requests
  },
): Promise<void> {
  // Identifica o cliente por IP ou user ID
  const identifier = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous"

  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    // Primeira request ou período expirado
    store[identifier] = {
      count: 1,
      resetTime: now + config.interval,
    }
    return
  }

  if (record.count >= config.uniqueTokenPerInterval) {
    const timeUntilReset = Math.ceil((record.resetTime - now) / 1000)
    throw new Error(`Rate limit exceeded. Try again in ${timeUntilReset}s`)
  }

  record.count++
}

// Rate limiter específico para endpoints sensíveis
export async function strictRateLimit(req: NextRequest): Promise<void> {
  return rateLimit(req, {
    interval: 60 * 1000, // 1 minuto
    uniqueTokenPerInterval: 5, // apenas 5 requests
  })
}

// Rate limiter para autenticação
export async function authRateLimit(req: NextRequest): Promise<void> {
  return rateLimit(req, {
    interval: 15 * 60 * 1000, // 15 minutos
    uniqueTokenPerInterval: 5, // 5 tentativas
  })
}
