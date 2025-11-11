"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const DashboardIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
    />
  </svg>
)

const UsersIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const ShieldIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

const BuildingIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
)

const BotIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
)

const CreditCardIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
)

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const MoonIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
)

const LogOutIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3z"
    />
  </svg>
)

const navigation = [
  {
    title: "ADMINISTRAÇÃO",
    items: [
      { name: "Dashboard", href: "/admin", icon: DashboardIcon },
      { name: "Usuários", href: "/admin/users", icon: UsersIcon },
      { name: "Administradores", href: "/admin/administrators", icon: ShieldIcon },
      { name: "Organizações", href: "/admin/organizations", icon: BuildingIcon },
      { name: "Agentes", href: "/admin/agents", icon: BotIcon },
      { name: "Pagamentos", href: "/admin/payments", icon: CreditCardIcon },
      { name: "Configurações", href: "/admin/settings", icon: SettingsIcon },
    ],
  },
]

interface AdminSidebarProps {
  adminUser: {
    id: string
    email: string | null | undefined
    full_name: string | null | undefined
  }
}

export function AdminSidebar({ adminUser }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<string[]>(["ADMINISTRAÇÃO"])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => (prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]))
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("[v0] Fazendo logout do admin...")

      const response = await fetch("/api/auth/signout", {
        method: "POST",
      })

      if (response.ok) {
        console.log("[v0] Logout bem-sucedido, redirecionando...")
        router.push("/auth/signin")
        router.refresh()
      } else {
        console.error("[v0] Erro ao fazer logout")
      }
    } catch (error) {
      console.error("[v0] Erro ao processar logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const SidebarContent = () => (
    <>
      <div className="flex h-14 md:h-16 items-center justify-between px-4 md:px-6 border-b">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="text-xl md:text-2xl font-bold text-gray-900">Admin GroovIA</div>
        </Link>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoonIcon />
        </Button>
      </div>

      <div className="px-3 md:px-4 py-3 md:py-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
            <ShieldIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{adminUser.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{adminUser.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 md:px-4 py-4 md:py-6">
        {navigation.map((section) => (
          <div key={section.title} className="mb-4 md:mb-6">
            <button
              onClick={() => toggleSection(section.title)}
              className="mb-2 md:mb-3 flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              {section.title}
              <ChevronDownIcon
                className={cn("h-3 w-3 transition-transform", expandedSections.includes(section.title) && "rotate-180")}
              />
            </button>
            {expandedSections.includes(section.title) && (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 md:gap-3 rounded-lg px-2.5 md:px-3 py-2 md:py-2.5 text-sm font-medium transition-colors",
                        isActive ? "bg-[#7C3AED] text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t p-3 md:p-4">
        <Button
          variant="outline"
          className="w-full justify-start bg-transparent text-sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOutIcon />
          {isLoggingOut ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden h-10 w-10 bg-white border border-gray-200 shadow-sm"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-white md:hidden">
          <div className="flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex h-screen w-64 flex-col bg-white border-r">
        <SidebarContent />
      </div>
    </>
  )
}
