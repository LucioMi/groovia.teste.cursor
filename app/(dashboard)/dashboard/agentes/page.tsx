"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useOrganization } from "@/lib/organization-context"

interface Agent {
  id: string
  name: string
  description: string
  status: string
  category: string
  conversation_count: number
  created_at: string
}

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.3-4.3"></path>
  </svg>
)

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
    <path d="M5 3v4"></path>
    <path d="M19 17v4"></path>
    <path d="M3 5h4"></path>
    <path d="M17 19h4"></path>
  </svg>
)

export default function AgentesPage() {
  const { currentOrganization } = useOrganization()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (currentOrganization) {
      fetchAgents()
    }
  }, [currentOrganization])

  const fetchAgents = async () => {
    try {
      console.log("[v0] Fetching agents for organization:", currentOrganization?.id)
      const response = await fetch(`/api/agents?organizationId=${currentOrganization?.id}`)
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(search.toLowerCase()) ||
      agent.description?.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#7C3AED] mx-auto mb-4" />
          <p className="text-gray-600">Carregando agentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#7C3AED] mb-2">Meus Agentes</h1>
        <p className="text-gray-600">Visualize e interaja com os agentes disponíveis</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          <Input
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 text-gray-400">
            <SparklesIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum agente disponível</h3>
          <p className="text-gray-600 mb-4">
            {search
              ? "Nenhum agente encontrado com esse termo de busca."
              : "Aguarde enquanto o administrador cria agentes para você usar."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                    <SparklesIcon />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"} className="mt-1">
                      {agent.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agent.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{agent.conversation_count || 0} conversas</span>
                <Button size="sm" variant="outline">
                  Usar Agente
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
