import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { FileText, Download, Trash2, Calendar, HardDrive, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

async function getDocuments(organizationId: string, searchQuery?: string) {
  const supabase = await createServerClient()

  let query = supabase
    .from("documents")
    .select(`
      id,
      name,
      file_url,
      file_type,
      file_size,
      created_at,
      conversation_id,
      agent_id
    `)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (searchQuery) {
    query = query.ilike("name", `%${searchQuery}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching documents:", error)
    return []
  }

  if (data && data.length > 0) {
    const agentIds = [...new Set(data.map((d) => d.agent_id).filter(Boolean))]

    if (agentIds.length > 0) {
      const { data: agents } = await supabase.from("agents").select("id, name").in("id", agentIds)

      const agentMap = new Map(agents?.map((a) => [a.id, a.name]) || [])

      return data.map((doc) => ({
        ...doc,
        agent_name: doc.agent_id ? agentMap.get(doc.agent_id) : null,
      }))
    }
  }

  return data || []
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "N/A"
  const sizes = ["Bytes", "KB", "MB", "GB"]
  if (bytes === 0) return "0 Bytes"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

async function DocumentsTable({ organizationId, searchQuery }: { organizationId: string; searchQuery?: string }) {
  const documents = await getDocuments(organizationId, searchQuery)

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery ? "Tente ajustar sua busca" : "Os documentos gerados aparecerão aqui"}
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Agente</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Tamanho</TableHead>
          <TableHead>Criado em</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc: any) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[200px]">{doc.name}</span>
              </div>
            </TableCell>
            <TableCell>
              {doc.agent_name ? (
                <Badge variant="secondary">{doc.agent_name}</Badge>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{doc.file_type || "HTML"}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</span>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">{formatDate(doc.created_at)}</span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                <form action={`/api/documents/${doc.id}/export-pdf`} method="POST">
                  <Button size="sm" variant="ghost" type="submit" title="Exportar como PDF">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </Button>
                </form>
                <form action={`/api/documents/${doc.id}/download`}>
                  <Button size="sm" variant="ghost" type="submit">
                    <Download className="h-4 w-4" />
                  </Button>
                </form>
                <form action={`/api/documents/${doc.id}/delete`} method="POST">
                  <Button size="sm" variant="ghost" type="submit">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </form>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const supabase = await createServerClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const adminSupabase = createAdminClient()
  const { data: membership } = await adminSupabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    redirect("/onboarding")
  }

  const organizationId = membership.organization_id

  // Get document stats
  const { count: totalDocs } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)

  const { data: sizeData } = await supabase.from("documents").select("file_size").eq("organization_id", organizationId)

  const totalSize = sizeData?.reduce((acc, doc) => acc + (doc.file_size || 0), 0) || 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gerencie todos os documentos gerados pela sua organização</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocs || 0}</div>
            <p className="text-xs text-muted-foreground">documentos gerados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espaço Utilizado</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">em armazenamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Documento</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hoje</div>
            <p className="text-xs text-muted-foreground">documento mais recente</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Documentos</CardTitle>
          <CardDescription>Visualize, baixe e gerencie seus documentos</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" placeholder="Buscar documentos..." defaultValue={params.q} className="pl-9" />
              </div>
              <Button type="submit">Buscar</Button>
            </div>
          </form>

          <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Carregando...</div>}>
            <DocumentsTable organizationId={organizationId} searchQuery={params.q} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
