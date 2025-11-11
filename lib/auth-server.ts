import "server-only"
import { supabaseAdmin } from "@/lib/db"
import { createServerClient as createClient } from "@/lib/supabase/server"

export async function getServerSession() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] getServerSession - user:", user ? `User ${user.id}` : "null")
    console.log("[v0] getServerSession - authError:", authError?.message || "none")

    if (authError || !user) {
      return null
    }

    const { data: preferences } = await supabaseAdmin
      .from("user_preferences")
      .select("selected_organization_id")
      .eq("user_id", user.id)
      .single()

    const selectedOrgId = preferences?.selected_organization_id

    // Get organization membership if organization is selected
    if (selectedOrgId) {
      const { data: memberships, error: memberError } = await supabaseAdmin
        .from("organization_memberships")
        .select(
          `
        role,
        organizations (
          name,
          plan_type
        )
      `,
        )
        .eq("user_id", user.id)
        .eq("organization_id", selectedOrgId)
        .single()

      if (!memberError && memberships) {
        return {
          user: {
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || "",
          },
          organization: {
            id: selectedOrgId,
            name: memberships.organizations?.name || "",
            plan: memberships.organizations?.plan_type || "free",
          },
          role: memberships.role,
        }
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        name: user.user_metadata?.name || "",
      },
      organization: null,
      role: "viewer" as const,
    }
  } catch (error) {
    console.error("[v0] getServerSession error:", error)
    return null
  }
}

export async function requireAuth() {
  const session = await getServerSession()
  console.log("[v0] requireAuth - session:", session ? `User ${session.user.id}` : "null")
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()
  const { checkUserPermission } = await import("@/lib/rbac")

  if (!session.organization) {
    throw new Error("No organization selected")
  }

  const hasPermission = await checkUserPermission(session.user.id, session.organization.id, permission as any)

  if (!hasPermission) {
    throw new Error("Insufficient permissions")
  }

  return session
}

export async function requireSuperAdmin() {
  console.log("[v0] requireSuperAdmin - Starting check")
  const session = await requireAuth()
  console.log("[v0] requireSuperAdmin - Session obtained:", session.user.id)

  // Check if user is super admin
  const { data: adminData, error } = await supabaseAdmin
    .from("super_admins")
    .select("id")
    .eq("user_id", session.user.id)
    .single()

  console.log("[v0] requireSuperAdmin - adminData:", adminData ? "found" : "null")
  console.log("[v0] requireSuperAdmin - error:", error?.message || "none")

  if (error || !adminData) {
    throw new Error("Unauthorized: Super admin access required")
  }

  console.log("[v0] requireSuperAdmin - Verification successful")
  return session
}
