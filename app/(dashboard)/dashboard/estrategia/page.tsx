"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useOrganization } from "@/lib/organization-context"
import { cn } from "@/lib/utils"
import { SuporteGroovia } from "@/components/suporte-groovia"

const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
)

const CircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
  </svg>
)

const LockIcon = () => (
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
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
)

const MessageCircleIcon = () => (
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

const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
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

interface JourneyStep {
  id: string
  step: number
  title: string
  agentName: string
  description: string
  agent?: Agent
  completed: boolean
  locked: boolean
  optional?: boolean
}

export default function EstrategiaPage() {
  const router = useRouter()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<JourneyStep[]>([
    {
      id: "estrategia-1",
      step: 1,
      title: "O Estrategista Corporativo",
      agentName: "Estrategista Corporativo",
      description: "Constrói, junto com você, a estratégia central que orienta toda a operação.",
      completed: false,
      locked: false,
    },
    {
      id: "estrategia-2",
      step: 2,
      title: "O DNA da Marca",
      agentName: "DNA da Marca",
      description: "Transforma a essência da sua empresa em uma marca playbook e estratégica de branding.",
      completed: false,
      locked: false,
    },
    {
      id: "estrategia-3",
      step: 3,
      title: "O Ativador de Marca",
      agentName: "Ativador de Marca",
      description: "Leva sua marca do papel à ação com um playbook prático e inspirador.",
      completed: false,
      locked: false,
      optional: true,
    },
    {
      id: "estrategia-4",
      step: 4,
      title: "Estrategista de Crescimento",
      agentName: "Estrategista de Crescimento",
      description: "Desenha o mapa que conecta marketing, vendas e atendimento em uma só rota de crescimento.",
      completed: false,
      locked: false,
    },
  ])

  useEffect(() => {
    console.log("[v0] Estratégia - orgLoading:", orgLoading, "currentOrganization:", currentOrganization?.id)

    if (!orgLoading) {
      if (currentOrganization) {
        fetchAgents()
      } else {
        console.log("[v0] No organization found, showing page without agents")
        setLoading(false)
      }
    }
  }, [currentOrganization, orgLoading])

  const fetchAgents = async () => {
    console.log("[v0] Fetching agents...")
    try {
      const response = await fetch(`/api/admin/agents`)
      console.log("[v0] Agents API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        const fetchedAgents = data.agents || []
        console.log(
          "[v0] Fetched agents:",
          fetchedAgents.length,
          fetchedAgents.map((a: Agent) => a.name),
        )
        setAgents(fetchedAgents)

        // Match agents with journey steps
        setSteps((prevSteps) =>
          prevSteps.map((step) => {
            const matchedAgent = fetchedAgents.find(
              (agent: Agent) =>
                agent.name.toLowerCase().includes(step.agentName.toLowerCase()) ||
                step.agentName.toLowerCase().includes(agent.name.toLowerCase()),
            )
            console.log("[v0] Step:", step.agentName, "Matched agent:", matchedAgent?.name || "none")
            return {
              ...step,
              agent: matchedAgent,
            }
          }),
        )
      }
    } catch (error) {
      console.error("[v0] Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartAgent = (agent?: Agent, stepId?: string) => {
    if (agent) {
      router.push(`/dashboard/agentes/${agent.id}?journey=estrategia&step=${stepId}`)
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-4" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-white border-2 border-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] p-8">
      <SuporteGroovia />

      <div className="mx-auto max-w-7xl space-y-12">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-[#7C3AED]">Estratégia</h1>
          <p className="text-lg text-gray-600">
            Construa a estratégia central da sua empresa, defina o DNA da marca e trace o caminho para o crescimento
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-[#10B981] transition-all duration-500"
              style={{
                width: `${(steps.filter((s) => s.completed).length / steps.length) * 100}%`,
              }}
            />
          </div>
          <div className="relative flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white transition-all",
                    step.completed
                      ? "border-[#10B981] text-[#10B981]"
                      : step.locked
                        ? "border-gray-200 text-gray-300"
                        : "border-[#7C3AED] text-[#7C3AED] ring-4 ring-[#7C3AED]/20",
                  )}
                >
                  {step.completed ? <CheckCircleIcon /> : step.locked ? <LockIcon /> : <CircleIcon />}
                </div>
                <div className="mt-2 text-xs font-semibold text-gray-500">
                  Passo {step.step}
                  {step.optional && <span className="ml-1 text-amber-500">(opcional)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 bg-white p-6 transition-all",
                step.completed
                  ? "border-green-200 bg-green-50/50"
                  : step.locked
                    ? "border-gray-200 opacity-60"
                    : step.optional
                      ? "border-amber-300 shadow-lg shadow-amber-300/10 hover:shadow-xl hover:shadow-amber-300/20"
                      : "border-[#7C3AED] shadow-lg shadow-[#7C3AED]/10 hover:shadow-xl hover:shadow-[#7C3AED]/20",
              )}
            >
              <div
                className={cn(
                  "absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold",
                  step.completed
                    ? "bg-green-100 text-green-600"
                    : step.locked
                      ? "bg-gray-100 text-gray-400"
                      : step.optional
                        ? "bg-amber-100 text-amber-600"
                        : "bg-[#7C3AED]/10 text-[#7C3AED]",
                )}
              >
                {step.step}
              </div>

              {/* Status Icon */}
              <div className="mb-4 flex items-center gap-2">
                {step.completed ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircleIcon />
                  </div>
                ) : step.locked ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <LockIcon />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      step.optional ? "bg-amber-100" : "bg-[#7C3AED]/10",
                    )}
                  >
                    <SparklesIcon />
                  </div>
                )}
                {step.agent && (
                  <div className="text-xs text-gray-500">
                    {step.agent.status === "active" ? "✓ Configurado" : "⚠ Inativo"}
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="mb-3 text-xl font-bold text-gray-900">{step.title}</h3>
              {step.optional && (
                <div className="mb-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  opcional
                </div>
              )}
              <p className="mb-6 text-sm leading-relaxed text-gray-600">{step.description}</p>

              {/* Action Button */}
              <Button
                onClick={() => handleStartAgent(step.agent, step.id)}
                disabled={step.locked || !step.agent}
                className={cn(
                  "w-full",
                  step.completed
                    ? "bg-green-600 hover:bg-green-700"
                    : step.locked || !step.agent
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : step.optional
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-[#7C3AED] hover:bg-[#6D28D9]",
                )}
              >
                {step.completed
                  ? "Revisar"
                  : step.locked
                    ? "Bloqueado"
                    : !step.agent
                      ? "Em configuração..."
                      : "Iniciar"}
              </Button>

              {step.locked && (
                <p className="mt-3 text-center text-xs text-gray-500">Complete o passo anterior para desbloquear</p>
              )}
              {!step.agent && !step.locked && (
                <p className="mt-3 text-center text-xs text-amber-600">
                  Aguardando configuração do agente pelo administrador
                </p>
              )}
            </div>
          ))}
        </div>

        {steps.filter((s) => !s.optional).every((s) => s.completed) && (
          <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Estratégia Concluída!</h2>
            <p className="mb-6 text-gray-600">
              Parabéns! Você completou a etapa de Estratégia. Sua empresa agora tem uma direção clara e um plano de
              crescimento definido.
            </p>
            <Button className="bg-[#7C3AED] hover:bg-[#6D28D9]">Ver Estratégia Completa</Button>
          </div>
        )}
      </div>
    </div>
  )
}
