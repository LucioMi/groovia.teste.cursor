"use client"

import type React from "react"

import { Bot, ArrowRight, Clock, Trash2, MoreVertical } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"

interface AgentCardProps {
  id: string
  name: string
  description: string
  category: string
  lastSession?: string
  status: string
  onDelete?: (id: string) => void
}

export function AgentCard({ id, name, description, category, lastSession, status, onDelete }: AgentCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_use":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído"
      case "in_use":
        return "Em Uso"
      default:
        return "Ativo"
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Tem certeza que deseja excluir o agente "${name}"?`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/agents/${id}`, { method: "DELETE" })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete agent")
      }

      console.log("[v0] Agent deleted successfully:", id)

      if (onDelete) {
        onDelete(id)
      } else {
        window.location.href = "/agentes"
      }
    } catch (error) {
      console.error("[v0] Error deleting agent:", error)
      alert("Erro ao deletar agente. Tente novamente.")
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  return (
    <div className="group relative">
      <Link href={`/agentes/${id}`}>
        <div className="group relative flex h-full flex-col rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
              <Bot className="h-7 w-7 text-[#7C3AED]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{category}</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowMenu(!showMenu)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h3 className="mb-2 text-lg font-bold text-gray-900">{name}</h3>
          <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-500">{description}</p>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              {lastSession ? (
                <span>
                  Última sessão{" "}
                  {formatDistanceToNow(new Date(lastSession), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              ) : (
                <span>Nenhuma sessão</span>
              )}
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-purple-50">
              <ArrowRight className="h-4 w-4 text-[#7C3AED]" />
            </div>
          </div>
        </div>
      </Link>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div className="absolute right-6 top-16 z-20 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 rounded-lg"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deletando..." : "Deletar Agente"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
