"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, AlertCircle, Loader2, Search, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AuditLog {
  id: string
  action_type: string
  resource_type: string
  resource_id: string | null
  actor_id: string
  actor_type: string
  actor_email: string | null
  organization_id: string | null
  changes: any
  metadata: any
  status: string
  error_message: string | null
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Filters
  const [actionTypeFilter, setActionTypeFilter] = useState("all")
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(50)

  useEffect(() => {
    loadLogs()
  }, [actionTypeFilter, resourceTypeFilter, currentPage])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * limit

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      })

      if (actionTypeFilter !== "all") {
        params.append("actionType", actionTypeFilter)
      }

      if (resourceTypeFilter !== "all") {
        params.append("resourceType", resourceTypeFilter)
      }

      if (searchQuery) {
        params.append("actorId", searchQuery)
      }

      const response = await fetch(`/api/admin/audit-logs?${params}`)

      if (!response.ok) throw new Error("Erro ao carregar logs de auditoria")

      const data = await response.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadLogs()
  }

  const handleClearFilters = () => {
    setActionTypeFilter("all")
    setResourceTypeFilter("all")
    setSearchQuery("")
    setCurrentPage(1)
  }

  const openDetailDialog = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailDialogOpen(true)
  }

  const getActionBadgeColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      logout: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      import: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "success"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const totalPages = Math.ceil(total / limit)

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
          <p className="text-muted-foreground">Rastreamento completo de todas as ações do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <Badge variant="outline" className="text-sm">
            {total} registros totais
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
          <CardDescription>Refine sua busca por tipo de ação, recurso ou usuário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="create">Criar</SelectItem>
                  <SelectItem value="update">Atualizar</SelectItem>
                  <SelectItem value="delete">Deletar</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="import">Importar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Recurso</label>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Recursos</SelectItem>
                  <SelectItem value="user">Usuários</SelectItem>
                  <SelectItem value="agent">Agentes</SelectItem>
                  <SelectItem value="organization">Organizações</SelectItem>
                  <SelectItem value="subscription">Assinaturas</SelectItem>
                  <SelectItem value="payment">Pagamentos</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar por ID do Usuário</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ID do usuário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
          <CardDescription>
            Página {currentPage} de {totalPages || 1} ({total} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log de auditoria encontrado</p>
              <p className="text-sm mt-2">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Ator</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action_type)}>{log.action_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.resource_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.actor_type}</TableCell>
                        <TableCell className="text-sm">{log.actor_email || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(log.status)}>{log.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openDetailDialog(log)}>
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * limit + 1} a {Math.min(currentPage * limit, total)} de {total}{" "}
                  registros
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
            <DialogDescription>Informações completas sobre a ação registrada</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                  <p className="text-sm font-mono">{new Date(selectedLog.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeColor(selectedLog.status)}>{selectedLog.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Ação</p>
                  <Badge className={getActionBadgeColor(selectedLog.action_type)}>{selectedLog.action_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Recurso</p>
                  <Badge variant="outline">{selectedLog.resource_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID do Recurso</p>
                  <p className="text-sm font-mono text-xs break-all">{selectedLog.resource_id || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tipo de Ator</p>
                  <p className="text-sm">{selectedLog.actor_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID do Ator</p>
                  <p className="text-sm font-mono text-xs break-all">{selectedLog.actor_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email do Ator</p>
                  <p className="text-sm">{selectedLog.actor_email || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">ID da Organização</p>
                  <p className="text-sm font-mono text-xs break-all">{selectedLog.organization_id || "-"}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Mensagem de Erro</p>
                  <Alert variant="destructive">
                    <AlertDescription className="text-sm">{selectedLog.error_message}</AlertDescription>
                  </Alert>
                </div>
              )}

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Alterações</p>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-auto">{JSON.stringify(selectedLog.changes, null, 2)}</pre>
                  </div>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Metadados</p>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="text-xs overflow-auto">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
