import type React from "react"
import { createServerClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin-sidebar"

async function getAdminUser() {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.log("[v0] No user found in session")
      return null
    }

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

    console.log("[v0] User role:", roles?.role)

    if (roles?.role !== "super_admin") {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.name || user.email || "Admin",
    }
  } catch (error) {
    console.error("[v0] Error getting admin user:", error)
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminUser = await getAdminUser()

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      {adminUser && <AdminSidebar adminUser={adminUser} />}
      <main className="flex-1 overflow-y-auto w-full min-w-0">{children}</main>
    </div>
  )
}
