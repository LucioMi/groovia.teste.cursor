import "server-only"
import { supabaseAdmin } from "./db"
import { cookies } from "next/headers"

export interface AuthUser {
  id: string
  email: string
  name: string
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("user_session")?.value

    if (!sessionToken) {
      return null
    }

    const { data: sessions, error } = await supabaseAdmin
      .from("user_sessions")
      .select(
        `
        user_id,
        users:user_id (
          id,
          email,
          name
        )
      `,
      )
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !sessions) {
      return null
    }

    const user = sessions.users as any
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    }
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentAuthUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}

export async function getUserSelectedOrganization(userId: string): Promise<string | null> {
  try {
    const { data: result, error } = await supabaseAdmin
      .from("user_preferences")
      .select("selected_organization_id")
      .eq("user_id", userId)
      .single()

    if (error) return null

    return result?.selected_organization_id || null
  } catch (error) {
    console.error("[v0] Error getting selected organization:", error)
    return null
  }
}
