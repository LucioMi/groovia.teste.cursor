"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function AdminLogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("[v0] Admin fazendo logout...")

      const response = await fetch("/api/auth/signout", {
        method: "POST",
      })

      if (response.ok) {
        console.log("[v0] Logout bem-sucedido, redirecionando para login admin...")
        router.push("/admin/login")
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Erro ao fazer logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoggingOut ? "Saindo..." : "Sair"}
    </Button>
  )
}
