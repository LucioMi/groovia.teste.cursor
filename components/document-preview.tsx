"use client"

import { FileText, Download, Sparkles, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DocumentPreviewProps {
  content: string
}

export function DocumentPreview({ content }: DocumentPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `documento-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Error copying to clipboard:", error)
    }
  }

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
  const charCount = content.length

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Documento</h3>
            <p className="text-xs text-gray-600">
              {content ? `${wordCount} palavras • ${charCount} caracteres` : "Aguardando conteúdo"}
            </p>
          </div>
        </div>
        {content && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 bg-transparent"
              title="Copiar para área de transferência"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2 bg-transparent"
              title="Baixar documento"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!content ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4 max-w-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Documento em Progresso</p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  O documento será gerado automaticamente conforme você interage com o agente
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-900">{content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
