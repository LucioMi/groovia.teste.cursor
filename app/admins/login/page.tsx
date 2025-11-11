"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("[v0] Admin login attempt...")

    try {
      const adminData = localStorage.getItem("grooveia_admin")

      if (!adminData) {
        setError("Nenhum administrador cadastrado. Configure o sistema primeiro.")
        setLoading(false)
        return
      }

      const admin = JSON.parse(adminData)

      if (admin.username === formData.username && admin.password === formData.password) {
        console.log("[v0] Login successful!")

        // Create session
        const session = {
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          loginAt: new Date().toISOString(),
        }

        localStorage.setItem("grooveia_admin_session", JSON.stringify(session))

        // Redirect to admin dashboard
        window.location.href = "/dashboard/admin"
      } else {
        setError("Usuário ou senha incorretos")
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login Administrativo</CardTitle>
          <CardDescription>Acesse o painel de administração do GrooveIA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Primeira vez?{" "}
              <a href="/admins/setup" className="text-blue-600 hover:underline">
                Configure o sistema
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
