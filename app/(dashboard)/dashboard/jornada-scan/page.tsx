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
  next_agent_id?: string
  is_passive?: boolean
  short_description?: string
}

interface JourneyStep {
  id: string
  step: number
  title: string
  agentName: string
  agentId: string | null // Can be null for document steps
  description: string
  agent?: Agent
  completed: boolean
  locked: boolean
  stepType?: string // agent, document, autonomous, synthetic
  stepTypeDisplay?: string // Display text for step type
}

export default function JornadaScanPage() {
  const router = useRouter()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [scanSteps, setScanSteps] = useState<any[]>([])

  const [steps, setSteps] = useState<JourneyStep[]>([])

  useEffect(() => {
    console.log("[v0] Jornada Scan - orgLoading:", orgLoading, "currentOrganization:", currentOrganization?.id)

    if (!orgLoading) {
      fetchAgents()
      fetchProgress()
    }
  }, [currentOrganization, orgLoading])

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/journey/progress?journeyType=scan")
      if (response.ok) {
        const data = await response.json()
        setCompletedSteps(data.completedSteps || [])
        setScanSteps(data.scanSteps || [])
        console.log("[v0] Loaded progress:", data.completedSteps)
        console.log("[v0] Loaded scan steps:", data.scanSteps?.length || 0)
      } else {
        console.error("[v0] Error fetching progress, status:", response.status)
        setCompletedSteps([])
        setScanSteps([])
      }
    } catch (error) {
      console.error("[v0] Error fetching progress:", error)
      setCompletedSteps([])
      setScanSteps([])
    }
  }
  
  const buildStepsFromScanSteps = (scanStepsData: any[], completed: string[], agentsData: Agent[]) => {
    const agentMap = new Map(agentsData.map((a: Agent) => [a.id, a]))
    const stepsFromScan: JourneyStep[] = []
    
    // Ordenar por step_order
    const sortedSteps = [...scanStepsData].sort((a, b) => a.step_order - b.step_order)
    
    sortedSteps.forEach((step: any, index: number) => {
      const stepId = `scan-${step.step_order}`
      const isCompleted = completed.includes(stepId)
      
      // Determinar se está bloqueado baseado em depends_on_step_ids
      let isLocked = false
      if (step.depends_on_step_ids && step.depends_on_step_ids.length > 0) {
        // Verificar se todas as dependências estão completas
        const allDependenciesCompleted = step.depends_on_step_ids.every((depId: string) => {
          const depStep = sortedSteps.find((s: any) => s.id === depId)
          if (!depStep) return true // Se não encontrar, considerar como completo
          const depStepId = `scan-${depStep.step_order}`
          return completed.includes(depStepId)
        })
        isLocked = !allDependenciesCompleted
      } else if (index > 0) {
        // Se não tem dependências definidas, bloquear se a etapa anterior não estiver completa
        const previousStepId = `scan-${sortedSteps[index - 1].step_order}`
        isLocked = !completed.includes(previousStepId)
      }
      
      let title = ""
      let description = ""
      let agent: Agent | undefined = undefined
      
      if (step.step_type === "document") {
        // Etapa de documento manual (SCAN Clarity)
        title = "SCAN Clarity"
        description = "Preencha com sua equipe de liderança esse decodificador do seu negócio. Baixe o template, preencha e faça upload do documento."
      } else if (step.agent_id) {
        // Etapa com agente
        agent = agentMap.get(step.agent_id)
        if (agent) {
          title = agent.name
          description = agent.description || agent.short_description || `Passo ${step.step_order} da jornada`
        } else {
          title = `Etapa ${step.step_order}`
          description = `Passo ${step.step_order} da jornada`
        }
      } else {
        title = `Etapa ${step.step_order}`
        description = `Passo ${step.step_order} da jornada`
      }
      
      // Determinar tipo de exibição
      let stepTypeDisplay = ""
      if (step.step_type === "document") {
        stepTypeDisplay = "Documento Manual"
      } else if (step.step_type === "autonomous") {
        stepTypeDisplay = "Automático"
      } else if (step.step_type === "synthetic") {
        stepTypeDisplay = "Sintético"
      } else {
        stepTypeDisplay = "Conversacional"
      }
      
      const displayDescription = description.length > 150 ? description.substring(0, 150) + "..." : description
      
      stepsFromScan.push({
        id: stepId,
        step: step.step_order,
        title,
        agentName: agent?.name || title,
        agentId: step.agent_id,
        description: displayDescription,
        agent,
        completed: isCompleted,
        locked: isLocked,
        stepType: step.step_type,
        stepTypeDisplay,
      })
    })
    
    console.log("[v0] === ETAPAS CONSTRUÍDAS DOS SCAN_STEPS ===")
    console.log("[v0] Total de etapas:", stepsFromScan.length)
    setSteps(stepsFromScan)
  }

  // Atualizar steps quando completedSteps, scanSteps ou agents mudarem
  useEffect(() => {
    // Se temos scan_steps E agentes, construir steps a partir dos scan_steps (inclui etapa de documento manual)
    if (scanSteps.length > 0 && agents.length > 0) {
      buildStepsFromScanSteps(scanSteps, completedSteps, agents)
    } else if (steps.length > 0 && scanSteps.length === 0) {
      // Se não temos scan_steps mas temos steps dos agentes, atualizar apenas status
      setSteps((prevSteps) =>
        prevSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const previousStepCompleted = index === 0 || completedSteps.includes(prevSteps[index - 1].id)

          return {
            ...step,
            completed: isCompleted,
            locked: !previousStepCompleted,
          }
        }),
      )
    }
  }, [completedSteps, scanSteps, agents])

  const fetchAgents = async () => {
    console.log("[v0] === INICIANDO BUSCA DE AGENTES ===")
    try {
      const response = await fetch(`/api/agents`)
      console.log("[v0] API response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        const fetchedAgents = data.agents || []

        console.log("[v0] === AGENTES RECEBIDOS ===")
        console.log("[v0] Total de agentes:", fetchedAgents.length)

        setAgents(fetchedAgents)

        if (fetchedAgents.length > 0) {
          const agentMap = new Map(fetchedAgents.map((a: Agent) => [a.id, a]))
          const agentsWithPredecessors = new Set(fetchedAgents.map((a: Agent) => a.next_agent_id).filter(Boolean))

          const firstAgent = fetchedAgents.find((a: Agent) => !agentsWithPredecessors.has(a.id))

          if (firstAgent) {
            const orderedSteps: JourneyStep[] = []
            let currentAgent: Agent | undefined = firstAgent
            let stepNumber = 1

            while (currentAgent && stepNumber <= 10) {
              const description = currentAgent.description || `Passo ${stepNumber} da jornada`
              const displayDescription = description.length > 150 ? description.substring(0, 150) + "..." : description

              orderedSteps.push({
                id: `scan-${stepNumber}`,
                step: stepNumber,
                title: currentAgent.name,
                agentName: currentAgent.name,
                agentId: currentAgent.id,
                description: displayDescription,
                agent: currentAgent,
                completed: false,
                locked: stepNumber > 1,
              })

              currentAgent = currentAgent.next_agent_id ? agentMap.get(currentAgent.next_agent_id) : undefined
              stepNumber++
            }

            console.log("[v0] === FLUXO CONSTRUÍDO ===")
            console.log("[v0] Total de passos:", orderedSteps.length)

            setSteps(orderedSteps)
          } else {
            const fallbackSteps = fetchedAgents.slice(0, 6).map((agent: Agent, index: number) => {
              const description = agent.description || `Passo ${index + 1} da jornada`
              const displayDescription = description.length > 150 ? description.substring(0, 150) + "..." : description

              return {
                id: `scan-${index + 1}`,
                step: index + 1,
                title: agent.name,
                agentName: agent.name,
                agentId: agent.id,
                description: displayDescription,
                agent,
                completed: false,
                locked: index > 0,
              }
            })

            setSteps(fallbackSteps)
          }
        }
      }
    } catch (error) {
      console.error("[v0] ❌ ERRO AO BUSCAR AGENTES:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartAgent = (agentId: string | null, stepId: string) => {
    const step = steps.find((s) => s.id === stepId)
    console.log("[v0] === INICIANDO ETAPA ===")
    console.log("[v0] Agent ID:", agentId)
    console.log("[v0] Step ID:", stepId)
    console.log("[v0] Step details:", step)
    console.log("[v0] Step type:", step?.stepType)

    // Verificar se é etapa do tipo "document" (documento manual - SCAN Clarity)
    if (step?.stepType === "document") {
      console.log("[v0] Etapa de documento manual - redirecionando para página de documento")
      // TODO: Implementar rota para página de documento manual
      // router.push(`/dashboard/jornada-scan/${stepId}/documento`)
      alert("Funcionalidade de documento manual em desenvolvimento. Você poderá baixar o template, preenchê-lo e fazer upload.")
    } else if (step?.stepType === "autonomous" || step?.stepType === "synthetic") {
      // Etapas autônomas são executadas automaticamente (já devem estar executando)
      console.log("[v0] Etapa autônoma - aguardando execução automática")
      alert("Esta etapa será executada automaticamente quando as etapas anteriores forem concluídas.")
    } else if (agentId && step?.agent) {
      // Etapa com agente conversacional
      console.log("[v0] Agente conversacional - redirecionando para chat")
      router.push(`/dashboard/agentes/${agentId}?journey=scan&step=${stepId}`)
    } else {
      console.log("[v0] Etapa desconhecida ou sem agente")
      alert("Esta etapa ainda não está disponível.")
    }
  }

  const handleCompleteStep = async (stepId: string) => {
    try {
      const response = await fetch("/api/journey/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyType: "scan",
          stepId,
        }),
      })

      if (response.ok) {
        setCompletedSteps([...completedSteps, stepId])
        console.log("[v0] Step marked complete:", stepId)
      }
    } catch (error) {
      console.error("[v0] Error marking step complete:", error)
    }
  }

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-64 animate-pulse rounded bg-gray-200 mb-4" />
          <div className="h-4 w-96 animate-pulse rounded bg-gray-200 mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
          <h1 className="mb-2 text-4xl font-bold text-[#7C3AED]">Jornada Scan</h1>
          <p className="text-lg text-gray-600">
            Siga esta jornada passo a passo para revelar o DNA da sua empresa e criar estratégias inteligentes
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-[#7C3AED] transition-all duration-500"
              style={{
                width: `${(steps.filter((s) => s.completed).length / steps.length) * 100}%`,
              }}
            />
          </div>
          <div className="relative flex justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-4 bg-white transition-all",
                    step.completed
                      ? "border-[#7C3AED] text-[#7C3AED]"
                      : step.locked
                        ? "border-gray-200 text-gray-300"
                        : "border-[#7C3AED] text-[#7C3AED] ring-4 ring-[#7C3AED]/20",
                  )}
                >
                  {step.completed ? <CheckCircleIcon /> : step.locked ? <LockIcon /> : <CircleIcon />}
                </div>
                <div className="mt-2 text-xs font-semibold text-gray-500">Passo {step.step}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 bg-white p-6 transition-all",
                step.completed
                  ? "border-green-200 bg-green-50/50"
                  : step.locked
                    ? "border-gray-200 opacity-60"
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
                      : "bg-[#7C3AED]/10 text-[#7C3AED]",
                )}
              >
                {step.step}
              </div>

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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7C3AED]/10">
                    <SparklesIcon />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {step.agent ? (
                    <>
                      <div className="text-xs text-gray-500">
                        {step.agent.status === "active" ? "✓ Ativo" : "⚠ Inativo"}
                      </div>
                      {step.agent.is_passive && <div className="text-xs text-purple-600 font-medium">🤖 Automático</div>}
                    </>
                  ) : step.stepTypeDisplay ? (
                    <div className="text-xs text-purple-600 font-medium">{step.stepTypeDisplay}</div>
                  ) : null}
                </div>
              </div>

              <h3 className="mb-3 text-xl font-bold text-gray-900">{step.title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">{step.description}</p>

              <Button
                onClick={() => handleStartAgent(step.agentId, step.id)}
                disabled={step.locked}
                className={cn(
                  "w-full",
                  step.completed
                    ? "bg-green-600 hover:bg-green-700"
                    : step.locked
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#7C3AED] hover:bg-[#6D28D9]",
                )}
              >
                {step.completed
                  ? "Revisar"
                  : step.locked
                    ? "Bloqueado"
                    : step.stepType === "document"
                      ? "Fazer Upload"
                      : step.stepType === "autonomous" || step.stepType === "synthetic"
                        ? "Aguardando"
                        : step.agent?.is_passive
                          ? "Executar"
                          : "Iniciar"}
              </Button>

              {step.locked && (
                <p className="mt-3 text-center text-xs text-gray-500">Complete o passo anterior para desbloquear</p>
              )}
            </div>
          ))}
        </div>

        {steps.length > 0 && steps.every((s) => s.completed) && (
          <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Jornada Concluída!</h2>
            <p className="mb-6 text-gray-600">
              Parabéns! Você completou toda a Jornada Scan. Agora você pode acessar seu dossiê inteligente completo.
            </p>
            <Button className="bg-[#7C3AED] hover:bg-[#6D28D9]">Ver Dossiê Completo</Button>
          </div>
        )}
      </div>
    </div>
  )
}
