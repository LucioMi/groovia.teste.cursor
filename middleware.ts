import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/middleware"
import { logger } from "./lib/logger"

// Rate limit store (em produção, usar Redis/Upstash)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return `${ip}:${request.nextUrl.pathname}`
}

function checkRateLimit(request: NextRequest, limit: number, window: number): boolean {
  const key = getRateLimitKey(request)
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + window,
    })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Limpa rate limit store periodicamente
if (typeof globalThis !== "undefined" && !(globalThis as any).rateLimitCleanerStarted) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000)
  ;(globalThis as any).rateLimitCleanerStarted = true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log("[v0] Middleware processing:", pathname)

  // Criar cliente Supabase para middleware
  const { supabase, response } = createClient(request)

  // Refresh session se necessário
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("[v0] Session exists:", !!session)

  // Security headers sempre presentes
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // HSTS apenas em produção
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  // Rate limiting para rotas de API
  if (pathname.startsWith("/api/")) {
    // Rate limit mais rigoroso para autenticação
    if (pathname.includes("/auth/signin") || pathname.includes("/auth/signup")) {
      if (!checkRateLimit(request, 5, 15 * 60 * 1000)) {
        // 5 requests em 15 min
        logger.warn("Auth rate limit exceeded", {
          pathname,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        })
        return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, { status: 429 })
      }
    }

    // Rate limit padrão para outras APIs
    else if (!checkRateLimit(request, 60, 60 * 1000)) {
      // 60 requests por minuto
      logger.warn("API rate limit exceeded", {
        pathname,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      })
      return NextResponse.json({ error: "Rate limit excedido. Tente novamente em breve." }, { status: 429 })
    }
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/(dashboard)") || // Adicionar suporte para route groups
    pathname.includes("/(dashboard)/") || // Match em qualquer lugar do path
    pathname.startsWith("/agentes") ||
    pathname.startsWith("/controle-agentes") ||
    pathname.startsWith("/documentos") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/sistema")
  ) {
    if (!session) {
      console.log("[v0] No session, redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }
  }

  // Verificar autenticação para rotas protegidas
  if (pathname.startsWith("/admin")) {
    // Páginas públicas do admin
    if (pathname === "/admin/setup") {
      console.log("[v0] Public admin page, allowing")
      return response
    }

    // Verificar se tem sessão do Supabase
    if (!session) {
      console.log("[v0] No Supabase session, redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    // The regular client causes infinite recursion because the RLS policy
    // on user_roles tries to check roles while checking roles
    const { createServiceClient } = await import("@/lib/supabase/service")
    const supabaseAdmin = createServiceClient()

    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching user role:", error)
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    console.log("[v0] User role:", roles?.role)

    if (!roles || roles.role !== "super_admin") {
      console.log("[v0] Not super_admin, redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    console.log("[v0] Super admin verified, allowing access")
  }

  return response
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/(dashboard)/:path*", // Adicionar matcher para route groups
    "/agentes/:path*",
    "/controle-agentes/:path*",
    "/documentos/:path*",
    "/perfil/:path*",
    "/sistema/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
}
