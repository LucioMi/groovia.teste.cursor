import { sql, isPreviewMode } from "@/lib/db"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"

const previewSessions = new Map<string, { adminUserId: string; expiresAt: Date }>()

export interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string | null
  is_active: boolean
}

export interface AdminSession {
  id: string
  admin_user_id: string
  token: string
  expires_at: Date
}

// Generate a random session token
function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function getPreviewAdminUsers(): any[] {
  return (globalThis as any).previewAdminUsers || []
}

// Create admin session
export async function createAdminSession(adminUserId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  if (isPreviewMode()) {
    console.log("[v0] Preview mode: Creating session in memory")
    previewSessions.set(token, { adminUserId, expiresAt })
    return token
  }

  await sql`
    INSERT INTO admin_sessions (admin_user_id, token, expires_at, ip_address, user_agent)
    VALUES (${adminUserId}, ${token}, ${expiresAt.toISOString()}, ${ipAddress}, ${userAgent})
  `

  await sql`
    UPDATE admin_users
    SET last_login = NOW()
    WHERE id = ${adminUserId}
  `

  return token
}

// Get admin user by session token
export async function getAdminUserByToken(token: string): Promise<AdminUser | null> {
  if (isPreviewMode()) {
    const session = previewSessions.get(token)

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    const previewUsers = getPreviewAdminUsers()
    const user = previewUsers.find((u: any) => u.id === session.adminUserId)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
    }
  }

  const result = await sql`
    SELECT u.id, u.username, u.email, u.full_name, u.is_active
    FROM admin_users u
    INNER JOIN admin_sessions s ON u.id = s.admin_user_id
    WHERE s.token = ${token}
      AND s.expires_at > NOW()
      AND u.is_active = true
  `

  if (result.length === 0) {
    return null
  }

  return result[0] as AdminUser
}

// Get current admin user from cookies
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value

  if (!token) {
    return null
  }

  return getAdminUserByToken(token)
}

// Authenticate admin user
export async function authenticateAdmin(
  username: string,
  password: string,
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    if (isPreviewMode()) {
      const previewUsers = getPreviewAdminUsers()
      const user = previewUsers.find((u: any) => u.username === username)

      if (!user) {
        return { success: false, error: "Usuário ou senha inválidos" }
      }

      if (!user.is_active) {
        return { success: false, error: "Usuário desativado" }
      }

      const isValidPassword = await verifyPassword(password, user.password_hash)

      if (!isValidPassword) {
        return { success: false, error: "Usuário ou senha inválidos" }
      }

      const token = await createAdminSession(user.id)

      return { success: true, token }
    }

    const result = await sql`
      SELECT id, username, password_hash, is_active
      FROM admin_users
      WHERE username = ${username}
    `

    if (result.length === 0) {
      return { success: false, error: "Usuário ou senha inválidos" }
    }

    const user = result[0] as {
      id: string
      username: string
      password_hash: string
      is_active: boolean
    }

    if (!user.is_active) {
      return { success: false, error: "Usuário desativado" }
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      return { success: false, error: "Usuário ou senha inválidos" }
    }

    const token = await createAdminSession(user.id)

    return { success: true, token }
  } catch (error) {
    console.error("[v0] Error authenticating admin:", error)
    return { success: false, error: "Erro ao autenticar" }
  }
}

// Delete admin session (logout)
export async function deleteAdminSession(token: string): Promise<void> {
  if (isPreviewMode()) {
    previewSessions.delete(token)
    return
  }

  await sql`
    DELETE FROM admin_sessions
    WHERE token = ${token}
  `
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  if (isPreviewMode()) {
    const now = new Date()
    for (const [token, session] of previewSessions.entries()) {
      if (session.expiresAt < now) {
        previewSessions.delete(token)
      }
    }
    return
  }

  await sql`
    DELETE FROM admin_sessions
    WHERE expires_at < NOW()
  `
}

export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  // For now, return a mock user for development
  // TODO: Integrate with Stack Auth or your auth provider
  return {
    id: "current-user",
    email: "user@example.com",
  }
}
