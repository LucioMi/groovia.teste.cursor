"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/lib/organization-context"
import { SuporteGroovia } from "@/components/suporte-groovia"
import { cn } from "@/lib/utils"

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
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

interface Agent {
  id: string
  name: string
  description: string
  status: string
  category: string
  system_prompt?: string
}

export default function TaticoPage() {
  const router = useRouter()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgLoading) {
      fetchAgent()
    }
  }, [orgLoading])

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/admin/agents`)
      if (response.ok) {
        const data = await response.json()
        const fetchedAgents = data.agents || []

        // Find the "Planejador de Ações" agent
        const planejadorAgent = fetchedAgents.find(
          (a: Agent) =>
            a.name.toLowerCase().includes("planejador") ||
            a.name.toLowerCase().includes("ações") ||
            a.name.toLowerCase().includes("tático"),
        )

        setAgent(planejadorAgent || null)
      }
    } catch (error) {
      console.error("[v0] Error fetching agent:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartAgent = () => {
    if (agent) {
      router.push(`/dashboard/agentes/${agent.id}?journey=tatico`)
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-4" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200 mb-12" />
          <div className="h-96 animate-pulse rounded-xl bg-white border-2 border-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] p-8">
      <SuporteGroovia />

      <div className="mx-auto max-w-4xl space-y-12">
        {/* Header */}
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Tático</h1>
          <p className="text-lg text-gray-600 mb-2">Planejamento Tático</p>
          <p className="text-base text-gray-500">Você chegou na etapa do seu Groovia Flow</p>
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#7C3AED] bg-white p-12 shadow-xl shadow-[#7C3AED]/10">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#7C3AED]/10 to-transparent rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-8">
            {/* Icon */}
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white shadow-lg">
              <SparklesIcon />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900">O Planejador de Ações</h2>

            {/* Description */}
            <p className="max-w-2xl text-lg leading-relaxed text-gray-600">
              Transforma a visão estratégica em planos de ação práticos e mensuráveis.
            </p>

            {/* Status */}
            {agent ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                Agente configurado e pronto para uso
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <div className="h-2 w-2 rounded-full bg-amber-600" />
                Aguardando configuração do agente
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleStartAgent}
              disabled={!agent}
              size="lg"
              className={cn(
                "px-12 py-6 text-lg font-semibold",
                agent
                  ? "bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-[#7C3AED]/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              {agent ? "Iniciar Planejamento" : "Em configuração..."}
            </Button>

            {/* Additional Info */}
            <div className="pt-8 border-t border-gray-200 w-full">
              <p className="text-sm text-gray-500">
                O Planejador de Ações irá ajudá-lo a criar um plano tático detalhado, definindo objetivos claros,
                métricas de sucesso e ações específicas para alcançar seus resultados estratégicos.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Objetivos Claros</h3>
            <p className="text-sm text-gray-600">Defina metas específicas e alcançáveis para cada área</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Métricas Definidas</h3>
            <p className="text-sm text-gray-600">Estabeleça indicadores para medir o progresso</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Ações Práticas</h3>
            <p className="text-sm text-gray-600">Crie um plano de ação detalhado e executável</p>
          </div>
        </div>
      </div>
    </div>
  )
}
