"use server"

import { supabaseAdmin } from "@/lib/db"
import { cookies } from "next/headers"

// Simple hash function for demo purposes
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export async function checkAdminExists() {
  try {
    console.log("[v0] Checking if admin exists...")
    const { count, error } = await supabaseAdmin
      .from("admin_users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    if (error) throw error

    console.log("[v0] Admin count:", count)
    return (count || 0) > 0
  } catch (error) {
    console.error("[v0] Error checking admin:", error)
    return false
  }
}

export async function createAdminUser(data: {
  username: string
  email: string
  password: string
  fullName?: string
}) {
  try {
    console.log("[v0] Creating admin user:", data.username)

    // Check if admin already exists
    const exists = await checkAdminExists()
    if (exists) {
      return { success: false, error: "Admin já existe" }
    }

    // Hash password
    const passwordHash = simpleHash(data.password)

    const { error } = await supabaseAdmin.from("admin_users").insert({
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      full_name: data.fullName || data.username,
      is_active: true,
    })

    if (error) throw error

    console.log("[v0] Admin user created successfully")
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error creating admin:", error)
    return { success: false, error: error.message || "Erro ao criar admin" }
  }
}

export async function loginAdmin(username: string, password: string) {
  try {
    console.log("[v0] Admin login attempt:", username)

    const passwordHash = simpleHash(password)

    const { data: result, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, username, email, full_name")
      .eq("username", username)
      .eq("password_hash", passwordHash)
      .eq("is_active", true)
      .single()

    if (error || !result) {
      return { success: false, error: "Credenciais inválidas" }
    }

    const admin = result

    // Create session
    const sessionToken = simpleHash(`${admin.id}-${Date.now()}-${Math.random()}`)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await supabaseAdmin.from("admin_sessions").insert({
      admin_user_id: admin.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    })

    console.log("[v0] Admin logged in successfully")
    return { success: true, admin }
  } catch (error: any) {
    console.error("[v0] Login error:", error)
    return { success: false, error: error.message || "Erro ao fazer login" }
  }
}

export async function logoutAdmin() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("admin_session")?.value

    if (sessionToken) {
      await supabaseAdmin.from("admin_sessions").delete().eq("session_token", sessionToken)
    }

    cookieStore.delete("admin_session")
    return { success: true }
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return { success: false }
  }
}

export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("admin_session")?.value

    if (!sessionToken) {
      return null
    }

    const { data: result, error } = await supabaseAdmin
      .from("admin_sessions")
      .select(
        `
        admin_users!inner (
          id,
          username,
          email,
          full_name
        )
      `,
      )
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !result) return null

    return result.admin_users
  } catch (error) {
    console.error("[v0] Error getting current admin:", error)
    return null
  }
}
