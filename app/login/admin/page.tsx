"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginAdminRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Redirecionando para login...</p>
      </div>
    </div>
  )
}
