"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, Plus, Edit, Trash2, Loader2, AlertCircle, Building2 } from "lucide-react"

interface Organization {
  id: string
  name: string
  slug: string
  plan_type: string | null
  plan_status: string | null
  member_count: number
  created_at: string
  updated_at: string
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    plan_type: "free",
  })

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async (search?: string) => {
    try {
      setLoading(true)
      const url = search ? `/api/admin/organizations?search=${encodeURIComponent(search)}` : "/api/admin/organizations"
      const response = await fetch(url)

      if (!response.ok) throw new Error("Erro ao carregar organizações")

      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadOrganizations(searchQuery)
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar organização")
      }

      setSuccess("Organização criada com sucesso!")
      setIsCreateDialogOpen(false)
      setFormData({ name: "", slug: "", plan_type: "free" })
      loadOrganizations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar organização")
    }
  }

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) return

    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Erro ao atualizar organização")

      setSuccess("Organização atualizada com sucesso!")
      setIsEditDialogOpen(false)
      setSelectedOrg(null)
      loadOrganizations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar organização")
    }
  }

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return

    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/organizations/${selectedOrg.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar organização")

      setSuccess("Organização deletada com sucesso!")
      setIsDeleteDialogOpen(false)
      setSelectedOrg(null)
      loadOrganizations()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar organização")
    }
  }

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org)
    setFormData({
      name: org.name,
      slug: org.slug,
      plan_type: org.plan_type || "free",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (org: Organization) => {
    setSelectedOrg(org)
    setIsDeleteDialogOpen(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Organizações</h2>
          <p className="text-muted-foreground">Visualizar, criar, editar e deletar organizações do sistema</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Organização
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Buscar Organizações</CardTitle>
          <CardDescription>Pesquise organizações por nome ou slug</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>Buscar</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                loadOrganizations()
              }}
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Organizações ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              Nenhuma organização encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{org.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{org.plan_type || "free"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.plan_status === "active" ? "default" : "secondary"}>
                        {org.plan_status || "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.member_count}</TableCell>
                    <TableCell>{new Date(org.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(org)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(org)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Organização</DialogTitle>
            <DialogDescription>Preencha os dados da nova organização</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrganization}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  type="text"
                  placeholder="Nome da organização"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setFormData({ ...formData, name, slug: generateSlug(name) })
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-slug">Slug *</Label>
                <Input
                  id="create-slug"
                  type="text"
                  placeholder="slug-da-organizacao"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">URL amigável gerada automaticamente</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-plan">Plano</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Organização</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Organização</DialogTitle>
            <DialogDescription>Atualize os dados da organização</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateOrganization}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  disabled
                />
                <p className="text-xs text-muted-foreground">Slug não pode ser alterado</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-plan">Plano</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar a organização <strong>{selectedOrg?.name}</strong>? Esta ação não pode ser
              desfeita e todos os dados relacionados serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrganization}>
              Deletar Organização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
