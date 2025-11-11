"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Loader2, AlertCircle, DollarSign, CheckCircle } from "lucide-react"

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price_in_cents: number
  interval: "month" | "year"
  features: string[]
  max_agents: number
  max_sessions_per_month: number
  max_webhooks: number
  is_active: boolean
  created_at: string
}

interface PlanFormData {
  name: string
  description: string
  price_in_cents: number
  interval: "month" | "year"
  features: string
  max_agents: number
  max_sessions_per_month: number
  max_webhooks: number
}

export default function AdminSettingsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    price_in_cents: 0,
    interval: "month",
    features: "",
    max_agents: 1,
    max_sessions_per_month: 100,
    max_webhooks: 3,
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/plans")

      if (!response.ok) throw new Error("Erro ao carregar planos")

      const data = await response.json()
      setPlans(data.plans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price_in_cents: 0,
      interval: "month",
      features: "",
      max_agents: 1,
      max_sessions_per_month: 100,
      max_webhooks: 3,
    })
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      // Parse features from text
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      const response = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: featuresArray,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao criar plano")
      }

      setSuccess("Plano criado com sucesso!")
      setIsCreateDialogOpen(false)
      resetForm()
      loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar plano")
    }
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return

    setError("")
    setSuccess("")

    try {
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)

      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          features: featuresArray,
        }),
      })

      if (!response.ok) throw new Error("Erro ao atualizar plano")

      setSuccess("Plano atualizado com sucesso!")
      setIsEditDialogOpen(false)
      setSelectedPlan(null)
      loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar plano")
    }
  }

  const handleDeletePlan = async () => {
    if (!selectedPlan) return

    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar plano")

      setSuccess("Plano desativado com sucesso!")
      setIsDeleteDialogOpen(false)
      setSelectedPlan(null)
      loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar plano")
    }
  }

  const openEditDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description,
      price_in_cents: plan.price_in_cents,
      interval: plan.interval,
      features: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      max_agents: plan.max_agents,
      max_sessions_per_month: plan.max_sessions_per_month,
      max_webhooks: plan.max_webhooks,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setIsDeleteDialogOpen(true)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100)
  }

  const formatLimit = (value: number) => {
    return value === -1 ? "Ilimitado" : value.toLocaleString("pt-BR")
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-muted-foreground">Gerenciar planos de assinatura e configurações gerais</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plans">Planos de Assinatura</TabsTrigger>
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planos de Assinatura</CardTitle>
                  <CardDescription>Gerencie os planos disponíveis para os clientes</CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Plano
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  Nenhum plano encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Limites</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(plan.price_in_cents)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.interval === "month" ? "Mensal" : "Anual"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <div>{formatLimit(plan.max_agents)} agentes</div>
                            <div>{formatLimit(plan.max_sessions_per_month)} sessões/mês</div>
                            <div>{formatLimit(plan.max_webhooks)} webhooks</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(plan.created_at).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(plan)}
                              disabled={!plan.is_active}
                            >
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
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>Configurações globais do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Configurações gerais em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
            <DialogDescription>Preencha os dados do novo plano de assinatura</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePlan}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome do Plano *</Label>
                  <Input
                    id="create-name"
                    type="text"
                    placeholder="Ex: Starter, Pro, Enterprise"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-interval">Intervalo de Cobrança *</Label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: "month" | "year") => setFormData({ ...formData, interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mensal</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-description">Descrição *</Label>
                <Input
                  id="create-description"
                  type="text"
                  placeholder="Descrição breve do plano"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-price">Preço (em centavos) *</Label>
                <Input
                  id="create-price"
                  type="number"
                  placeholder="Ex: 2900 para $29.00"
                  value={formData.price_in_cents}
                  onChange={(e) => setFormData({ ...formData, price_in_cents: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor em centavos: {formatCurrency(formData.price_in_cents)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-agents">Máx. Agentes *</Label>
                  <Input
                    id="create-agents"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.max_agents}
                    onChange={(e) => setFormData({ ...formData, max_agents: Number.parseInt(e.target.value) || 1 })}
                    min="-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">-1 para ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-sessions">Máx. Sessões/Mês *</Label>
                  <Input
                    id="create-sessions"
                    type="number"
                    placeholder="Ex: 1000"
                    value={formData.max_sessions_per_month}
                    onChange={(e) =>
                      setFormData({ ...formData, max_sessions_per_month: Number.parseInt(e.target.value) || 100 })
                    }
                    min="-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">-1 para ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-webhooks">Máx. Webhooks *</Label>
                  <Input
                    id="create-webhooks"
                    type="number"
                    placeholder="Ex: 50"
                    value={formData.max_webhooks}
                    onChange={(e) => setFormData({ ...formData, max_webhooks: Number.parseInt(e.target.value) || 3 })}
                    min="-1"
                    required
                  />
                  <p className="text-xs text-muted-foreground">-1 para ilimitado</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-features">Funcionalidades (uma por linha) *</Label>
                <Textarea
                  id="create-features"
                  placeholder="Ex:&#10;Suporte prioritário&#10;Análises avançadas&#10;Webhooks ilimitados"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">Digite uma funcionalidade por linha</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Criar Plano</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>Atualize os dados do plano de assinatura</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePlan}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nome do Plano</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-interval">Intervalo de Cobrança</Label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: "month" | "year") => setFormData({ ...formData, interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mensal</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-price">Preço (em centavos)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price_in_cents}
                  onChange={(e) => setFormData({ ...formData, price_in_cents: Number.parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor em centavos: {formatCurrency(formData.price_in_cents)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-agents">Máx. Agentes</Label>
                  <Input
                    id="edit-agents"
                    type="number"
                    value={formData.max_agents}
                    onChange={(e) => setFormData({ ...formData, max_agents: Number.parseInt(e.target.value) || 1 })}
                    min="-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sessions">Máx. Sessões/Mês</Label>
                  <Input
                    id="edit-sessions"
                    type="number"
                    value={formData.max_sessions_per_month}
                    onChange={(e) =>
                      setFormData({ ...formData, max_sessions_per_month: Number.parseInt(e.target.value) || 100 })
                    }
                    min="-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-webhooks">Máx. Webhooks</Label>
                  <Input
                    id="edit-webhooks"
                    type="number"
                    value={formData.max_webhooks}
                    onChange={(e) => setFormData({ ...formData, max_webhooks: Number.parseInt(e.target.value) || 3 })}
                    min="-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-features">Funcionalidades (uma por linha)</Label>
                <Textarea
                  id="edit-features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={6}
                />
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
            <DialogTitle>Confirmar Desativação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja desativar o plano <strong>{selectedPlan?.name}</strong>? O plano não será excluído,
              mas ficará inativo e não aparecerá para novos usuários.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeletePlan}>
              Desativar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
