"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Bot, Download, Plus, Loader2, CheckCircle2, AlertCircle, Edit, Trash2, FileText, LinkIcon } from "lucide-react"
import Link from "next/link"

interface Agent {
  id: string
  name: string
  description: string | null
  status: string
  category: string | null
  openai_assistant_id: string | null
  openai_vector_store_id: string | null
  next_agent_id: string | null
  system_prompt: string | null
  organization_name: string | null
  conversation_count: number
  created_at: string
}

interface OpenAIAssistant {
  id: string
  name: string
  description: string
  model: string
  instructions: string
  tools: any[]
  vector_stores: Array<{
    id: string
    name: string
    file_count: number
  }>
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [availableAssistants, setAvailableAssistants] = useState<OpenAIAssistant[]>([])
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([])
  const [loadingAssistants, setLoadingAssistants] = useState(false)
  const [importing, setImporting] = useState(false)

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    status: "active",
    category: "OpenAI", // Updated default value to be a non-empty string
    next_agent_id: "",
    execution_mode: true,
    system_prompt: "",
  })

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/agents")
      if (!response.ok) throw new Error("Erro ao carregar agentes")

      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar agentes")
    } finally {
      setLoading(false)
    }
  }

  const openImportModal = async () => {
    setShowImportModal(true)
    setLoadingAssistants(true)
    setError("")
    console.log("[v0] Opening import modal, fetching assistants...")

    try {
      console.log("[v0] Calling /api/admin/agents/list-openai-assistants...")
      const response = await fetch("/api/admin/agents/list-openai-assistants")
      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        throw new Error(errorData.error || "Erro ao listar assistentes")
      }

      const data = await response.json()
      console.log("[v0] Received assistants:", data.assistants?.length || 0)
      setAvailableAssistants(data.assistants || [])
    } catch (err) {
      console.error("[v0] Error in openImportModal:", err)
      setError(err instanceof Error ? err.message : "Erro ao buscar assistentes")
    } finally {
      setLoadingAssistants(false)
    }
  }

  const toggleAssistantSelection = (id: string) => {
    setSelectedAssistants((prev) => (prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]))
  }

  const handleImport = async () => {
    if (selectedAssistants.length === 0) {
      setError("Selecione pelo menos um assistente")
      return
    }

    setImporting(true)
    setError("")

    try {
      const response = await fetch("/api/admin/agents/import-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantIds: selectedAssistants,
          flowConfig: {},
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao importar")
      }

      const data = await response.json()
      setSuccess(data.message || "Assistentes importados com sucesso!")
      setShowImportModal(false)
      setSelectedAssistants([])
      loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar")
    } finally {
      setImporting(false)
    }
  }

  const openEditModal = (agent: Agent) => {
    setEditingAgent(agent)
    setEditForm({
      name: agent.name,
      description: agent.description || "",
      status: agent.status,
      category: agent.category || "OpenAI", // Updated default value to be a non-empty string
      next_agent_id: agent.next_agent_id || "",
      execution_mode: true,
      system_prompt: agent.system_prompt || "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (!editingAgent) return

    try {
      const response = await fetch(`/api/admin/agents/${editingAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (!response.ok) throw new Error("Erro ao atualizar agente")

      setSuccess("Agente atualizado com sucesso!")
      setShowEditModal(false)
      setEditingAgent(null)
      loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar")
    }
  }

  const handleDelete = async (agentId: string) => {
    if (!confirm("Tem certeza que deseja deletar este agente?")) return

    try {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erro ao deletar agente")

      setSuccess("Agente deletado com sucesso!")
      loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar")
    }
  }

  const stats = {
    total: agents.length,
    active: agents.filter((a) => a.status === "active").length,
    conversations: agents.reduce((sum, a) => sum + a.conversation_count, 0),
  }

  return (
    <div className="flex-1 space-y-6 p-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciar Agentes IA</h2>
          <p className="text-gray-500 text-sm mt-1">Visualizar, criar, editar e deletar agentes do sistema</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/agents/sequence">
            <Button variant="outline" size="sm">
              <LinkIcon className="mr-2 h-4 w-4" />
              Configurar Sequência
            </Button>
          </Link>
          <Button onClick={openImportModal} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Importar da OpenAI
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Agentes</CardTitle>
            <Bot className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agentes Ativos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Conversas</CardTitle>
            <Bot className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-base font-semibold">Lista de Agentes ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Nenhum agente encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/30">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Descrição</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Categoria</TableHead>
                    <TableHead className="font-semibold text-gray-700">Organização</TableHead>
                    <TableHead className="font-semibold text-gray-700">Conversas</TableHead>
                    <TableHead className="font-semibold text-gray-700">Criado em</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell className="max-w-md text-sm text-gray-600">
                        {agent.description
                          ? agent.description.length > 60
                            ? agent.description.substring(0, 60) + "..."
                            : agent.description
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            agent.status === "active"
                              ? "bg-black text-white hover:bg-black"
                              : "bg-gray-200 text-gray-700"
                          }
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-300 text-gray-700">
                          {agent.category || "OpenAI"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{agent.organization_name || "-"}</TableCell>
                      <TableCell className="text-gray-600">{agent.conversation_count}</TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(agent.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(agent.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Importar Assistentes da OpenAI</DialogTitle>
            <DialogDescription className="text-gray-500">
              Selecione os assistentes que deseja importar para o sistema
            </DialogDescription>
          </DialogHeader>

          {error && !loadingAssistants && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 overflow-y-auto max-h-[50vh]">
            {loadingAssistants ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : availableAssistants.length === 0 ? (
              /* Better empty state message */
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum assistente encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  {error ? "Verifique sua conexão e tente novamente" : "Configure assistentes na OpenAI primeiro"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">{availableAssistants.length} assistente(s) disponível(is)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedAssistants(
                        selectedAssistants.length === availableAssistants.length
                          ? []
                          : availableAssistants.map((a) => a.id),
                      )
                    }
                  >
                    Selecionar Todos
                  </Button>
                </div>

                <div className="space-y-2">
                  {availableAssistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAssistants.includes(assistant.id)
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => toggleAssistantSelection(assistant.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAssistants.includes(assistant.id)}
                          onChange={() => toggleAssistantSelection(assistant.id)}
                          className="mt-1 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{assistant.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {assistant.model}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{assistant.description}</p>

                          {assistant.vector_stores.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {assistant.vector_stores.map((vs) => (
                                <Badge
                                  key={vs.id}
                                  variant="secondary"
                                  className="text-xs bg-yellow-100 text-yellow-800 border-0"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  Vector store for {assistant.name.split(" ")[0]} ({vs.file_count} arquivos)
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || selectedAssistants.length === 0}
              className="bg-gray-700 hover:bg-gray-800"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>Próximo: Configurar Fluxo ({selectedAssistants.length} selecionados)</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Editar Agente: {editingAgent?.name}</DialogTitle>
            <DialogDescription className="text-gray-500">Atualize as informações básicas do agente</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome do agente"
                className="border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Descrição</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrição do agente"
                rows={2}
                className="border-gray-300 resize-none"
              />
              <p className="text-xs text-gray-500">Esta é a descrição que aparecerá para os usuários</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Modo de Execução</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Define como o agente será acionado no fluxo</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">{editForm.execution_mode ? "Ativo" : "Passivo"}</Label>
                  <Switch
                    checked={editForm.execution_mode}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, execution_mode: checked })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {editForm.execution_mode ? "Requer interação do usuário para iniciar" : "Execução automática"}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Próximo Agente no Fluxo</Label>
              <Select
                value={editForm.next_agent_id}
                onValueChange={(value) => setEditForm({ ...editForm, next_agent_id: value })}
              >
                <SelectTrigger className="border-gray-300">
                  <SelectValue placeholder="Selecione o próximo agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {agents
                    .filter((a) => a.id !== editingAgent?.id)
                    .map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Define qual agente será acionado automaticamente após este completar sua tarefa
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Prompt do Sistema (Somente Leitura)</Label>
                <Badge variant="secondary" className="text-xs">
                  OpenAI
                </Badge>
              </div>
              <Textarea
                value={editForm.system_prompt}
                readOnly
                rows={6}
                className="bg-gray-100 border-gray-300 font-mono text-xs text-gray-700 resize-none"
              />
              <p className="text-xs text-gray-500">
                O prompt do sistema é gerenciado pela OpenAI e não pode ser editado aqui
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} className="bg-black hover:bg-gray-800">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
