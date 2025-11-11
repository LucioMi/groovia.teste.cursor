"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, AlertCircle, CheckCircle } from "lucide-react"

export default function AdminSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })

  useEffect(() => {
    checkSetup()
  }, [])

  async function checkSetup() {
    try {
      console.log("[v0] Verificando se precisa de setup...")
      const res = await fetch("/api/admin/setup")
      const data = await res.json()

      console.log("[v0] Status do setup:", data)

      if (!data.needsSetup) {
        console.log("[v0] Já existe admin, redirecionando para signin")
        setTimeout(() => {
          router.push("/auth/signin")
        }, 1000)
      }
    } catch (err: any) {
      console.error("[v0] Erro ao verificar setup:", err)
      setError("Erro ao verificar status do sistema")
    } finally {
      setChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    console.log("[v0] Criando primeiro admin...")

    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      console.log("[v0] Resposta do setup:", data)

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar admin")
      }

      setSuccess(true)
      console.log("[v0] Admin criado! Redirecionando para admin/login...")

      setTimeout(() => {
        router.push("/admin/login")
      }, 2000)
    } catch (err: any) {
      console.error("[v0] Erro no setup:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Verificando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">Criar Primeiro Admin</CardTitle>
          <CardDescription>Configure o primeiro administrador do sistema GrooveIA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200 animate-in fade-in-from-top-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>Admin criado com sucesso! Redirecionando para login...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading || success}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@groovia.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading || success}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha * (mínimo 6 caracteres)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                disabled={loading || success}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando Admin...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Admin Criado!
                </>
              ) : (
                "Criar Primeiro Administrador"
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">📌 Importante:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Este será o primeiro administrador com acesso completo ao sistema</li>
              <li>• Guarde as credenciais em local seguro</li>
              <li>• Após criar, faça login em /admin/login</li>
              <li>• Você terá acesso ao painel administrativo completo</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
