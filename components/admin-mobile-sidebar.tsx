"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LayoutDashboard, Users, Building2, Settings, Shield, Bot, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AdminLogoutButton } from "@/components/admin-logout-button"

interface AdminMobileSidebarProps {
  adminUser: {
    id: string
    email: string | undefined
    full_name: string
  }
}

export function AdminMobileSidebar({ adminUser }: AdminMobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-3 left-3 z-50 md:hidden h-10 w-10 bg-white border border-gray-200 shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 bg-gray-50">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center px-4 border-b bg-white">
            <h1 className="text-lg font-bold">Admin GrooveIA</h1>
          </div>

          <div className="flex flex-col p-3 space-y-1 flex-1 overflow-y-auto">
            <Link href="/admin" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <Link href="/admin/users" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Users className="mr-2 h-4 w-4" />
                Usuários
              </Button>
            </Link>

            <Link href="/admin/admins" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Shield className="mr-2 h-4 w-4" />
                Administradores
              </Button>
            </Link>

            <Link href="/admin/organizations" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Building2 className="mr-2 h-4 w-4" />
                Organizações
              </Button>
            </Link>

            <Link href="/admin/agents" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Bot className="mr-2 h-4 w-4" />
                Agentes
              </Button>
            </Link>

            <Link href="/admin/payments" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagamentos
              </Button>
            </Link>

            <Link href="/admin/settings" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </Link>
          </div>

          <div className="border-t p-3 bg-white">
            <div className="mb-2 px-2">
              <p className="text-sm font-medium truncate">{adminUser.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{adminUser.email}</p>
            </div>
            <AdminLogoutButton />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
