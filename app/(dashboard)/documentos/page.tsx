"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FileText, Upload, Trash2, Download, Search, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"

interface Document {
  id: string
  name: string
  content: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  user_id: string | null
  agent_id: string | null
  organization_id: string | null
  created_at: string
  updated_at: string
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error("[v0] Error fetching documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      console.log("[v0] Uploading file:", file.name)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "uploads")
      formData.append("description", "Documento enviado pelo usuário")

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error("[v0] Upload failed:", errorText)
        throw new Error("Upload failed")
      }

      const uploadData = await uploadResponse.json()
      console.log("[v0] Upload successful:", uploadData)

      // Refresh the list
      await fetchDocuments()

      // Reset the input
      event.target.value = ""

      alert("Documento enviado com sucesso!")
    } catch (error) {
      console.error("[v0] Error uploading file:", error)
      alert(`Erro ao fazer upload do arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) {
      return
    }

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete document")
      }

      await fetchDocuments()
      alert("Documento excluído com sucesso!")
    } catch (error) {
      console.error("[v0] Error deleting document:", error)
      alert("Erro ao excluir documento")
    }
  }

  const handleDownload = (doc: Document) => {
    console.log("[v0] Opening document:", doc)

    const url = doc.file_url || doc.content

    if (!url) {
      alert("Este documento não possui conteúdo")
      return
    }

    try {
      new URL(url)
      console.log("[v0] Opening Blob URL:", url)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (error) {
      console.log("[v0] Creating download for text content")
      const blob = new Blob([url], { type: doc.file_type || "text/plain" })
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = doc.name
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const filteredDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Meus Documentos</h1>
          <p className="text-base text-gray-500">
            Gerencie todos os documentos criados pelos seus agentes e faça upload de novos arquivos
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="relative">
            <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Enviando..." : "Fazer Upload"}
            </Button>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="flex h-[400px] items-center justify-center rounded-xl bg-white shadow-sm">
            <p className="text-gray-400">Carregando documentos...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex h-[400px] flex-col items-center justify-center rounded-xl bg-white shadow-sm">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-gray-400">{searchQuery ? "Nenhum documento encontrado" : "Nenhum documento ainda"}</p>
            {!searchQuery && (
              <p className="mt-2 text-sm text-gray-400">Faça upload do seu primeiro documento usando o botão acima</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate" title={doc.name}>
                        {doc.name}
                      </h3>
                      <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString("pt-BR")}</p>
                      {doc.file_size && <p className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)} className="flex-1">
                      {doc.file_url ? <ExternalLink className="mr-1 h-3 w-3" /> : <Download className="mr-1 h-3 w-3" />}
                      Abrir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
