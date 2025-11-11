"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationSlug: "",
  })

  const handleNameChange = (name: string) => {
    setFormData({
      organizationName: name,
      organizationSlug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get existing organizations from localStorage
      const existingOrgs = JSON.parse(localStorage.getItem("organizations") || "[]")

      // Check if slug already exists
      if (existingOrgs.some((org: any) => org.slug === formData.organizationSlug)) {
        throw new Error("Este slug já está em uso. Por favor, escolha outro.")
      }

      // Create new organization
      const newOrg = {
        id: Date.now().toString(),
        name: formData.organizationName,
        slug: formData.organizationSlug,
        createdAt: new Date().toISOString(),
        members: 1,
        plan: "free",
      }

      // Save to localStorage
      const updatedOrgs = [...existingOrgs, newOrg]
      localStorage.setItem("organizations", JSON.stringify(updatedOrgs))
      localStorage.setItem("selectedOrganization", newOrg.id)

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo ao Groov.ia!</CardTitle>
          <CardDescription>Vamos configurar seu workspace para começar a criar agentes de IA</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nome da Organização</Label>
              <Input
                id="organizationName"
                placeholder="Minha Empresa"
                value={formData.organizationName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">Este será o nome do seu workspace</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationSlug">URL do Workspace</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">groov.ia/</span>
                <Input
                  id="organizationSlug"
                  placeholder="minha-empresa"
                  value={formData.organizationSlug}
                  onChange={(e) => setFormData({ ...formData, organizationSlug: e.target.value })}
                  required
                  disabled={isLoading}
                  pattern="[a-z0-9-]+"
                  title="Apenas letras minúsculas, números e hífens"
                />
              </div>
              <p className="text-sm text-muted-foreground">URL única para acessar seu workspace</p>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Criando workspace...
                </>
              ) : (
                "Criar Workspace"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
