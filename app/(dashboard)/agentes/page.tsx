"use client"

import { useEffect, useState } from "react"
import { AgentCard } from "@/components/agent-card"
import { Search, Bot, Sparkles } from "@/components/lucide-polyfill"

interface Agent {
  id: string
  name: string
  description: string
  category: string
  status: string
  last_session: string
}

export default function AgentesPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    filterAgents()
  }, [agents, searchQuery, statusFilter])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error("[v0] Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = () => {
    let filtered = agents

    if (statusFilter !== "all") {
      filtered = filtered.filter((agent) => {
        if (statusFilter === "completed") return agent.status === "completed"
        if (statusFilter === "in_use") return agent.status === "in_use"
        return true
      })
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agent.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredAgents(filtered)
  }

  const initializeDatabase = async () => {
    setIsSeeding(true)
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        console.log("[v0] Database initialized:", data.message)
        await fetchAgents()
      } else {
        console.error("[v0] Failed to initialize database:", data.error)
        alert("Erro ao inicializar banco de dados. Verifique o console.")
      }
    } catch (error) {
      console.error("[v0] Error initializing database:", error)
      alert("Erro ao inicializar banco de dados. Verifique o console.")
    } finally {
      setIsSeeding(false)
    }
  }

  const handleDeleteAgent = (deletedId: string) => {
    setAgents(agents.filter((agent) => agent.id !== deletedId))
    setFilteredAgents(filteredAgents.filter((agent) => agent.id !== deletedId))

    console.log("[v0] Agent removed from list:", deletedId)

    if (agents.length === 1) {
      console.log("[v0] No agents remaining, showing empty state")
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Meus Agentes</h1>
          <p className="text-base text-gray-500">Acesse e gerencie todos os agentes de IA disponíveis para você</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar agentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                statusFilter === "all" ? "bg-[#7C3AED] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter("in_use")}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                statusFilter === "in_use" ? "bg-[#7C3AED] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Em Uso
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                statusFilter === "completed" ? "bg-[#7C3AED] text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Concluídos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                id={agent.id}
                name={agent.name}
                description={agent.description}
                category={agent.category}
                lastSession={agent.last_session}
                status={agent.status}
                onDelete={handleDeleteAgent}
              />
            ))}
          </div>
        )}

        {!loading && filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-white py-16 text-center">
            <Bot className="mb-4 h-12 w-12 text-gray-300" />
            {agents.length === 0 ? (
              <>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">Bem-vindo ao Groovia!</h3>
                <p className="mb-6 max-w-md text-sm text-gray-500">
                  Seu banco de dados está vazio. Inicialize o sistema com agentes pré-configurados ou importe seus
                  próprios agentes da OpenAI.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={initializeDatabase}
                    disabled={isSeeding}
                    className="flex items-center gap-2 rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#6D28D9] disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    {isSeeding ? "Inicializando..." : "Inicializar com Agentes Padrão"}
                  </button>
                  <a
                    href="/admin/agentes"
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Importar da OpenAI
                  </a>
                </div>
              </>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-semibold text-gray-900">Nenhum agente encontrado</h3>
                <p className="text-sm text-gray-500">Tente ajustar seus filtros ou busca</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
