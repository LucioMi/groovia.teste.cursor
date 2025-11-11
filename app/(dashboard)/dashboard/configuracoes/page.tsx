"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Organization {
  id: string
  name: string
  slug: string
  description: string
  website: string
}

export default function ConfiguracoesPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      // Mock data for now
      const mockOrg: Organization = {
        id: "org-1",
        name: "BE Agencia",
        slug: "be-agencia",
        description: "Agência de marketing digital e desenvolvimento",
        website: "https://beagencia.com",
      }
      setOrganization(mockOrg)
    } catch (error) {
      console.error("[v0] Error fetching organization:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Mock save
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("[v0] Organization updated:", organization)
    } catch (error) {
      console.error("[v0] Error saving organization:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <svg className="h-8 w-8 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    )
  }

  if (!organization) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações da Organização</h1>
        <p className="text-muted-foreground mt-2">Gerencie as informações da sua organização</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>Atualize os detalhes da sua organização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Organização</Label>
            <Input
              id="name"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={organization.slug}
              onChange={(e) => setOrganization({ ...organization, slug: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">groov.ia/{organization.slug}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              value={organization.description}
              onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={organization.website}
              onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Excluir Organização</p>
              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita. Todos os dados serão permanentemente removidos.
              </p>
            </div>
            <Button variant="destructive">Excluir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
