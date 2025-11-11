import type React from "react"
import { Sidebar } from "@/components/sidebar"
import { OrganizationProvider } from "@/lib/organization-context"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <OrganizationProvider>
      <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto w-full min-w-0">{children}</main>
      </div>
    </OrganizationProvider>
  )
}
