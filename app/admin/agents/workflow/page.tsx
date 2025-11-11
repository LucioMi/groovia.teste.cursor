"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, ArrowRight, Save, Workflow } from "lucide-react"
import Link from "next/link"

interface Agent {
  id: string
  name: string
  description: string | null
  status: string
  next_agent_id: string | null
}

export default function WorkflowPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [flowConfig, setFlowConfig] = useState<Record<string, string>>({})

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/agents")

      if (!response.ok) throw new Error("Erro ao carregar agentes")

      const data = await response.json()
      const loadedAgents = data.agents || []
      setAgents(loadedAgents)

      // Carrega configuração atual
      const currentConfig: Record<string, string> = {}
      loadedAgents.forEach((agent: Agent) => {
        if (agent.next_agent_id) {
          currentConfig[agent.id] = agent.next_agent_id
        }
      })
      setFlowConfig(currentConfig)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const updateFlowConfig = (agentId: string, nextAgentId: string) => {
    setFlowConfig((prev) => {
      const newConfig = { ...prev }
      if (nextAgentId === "none" || !nextAgentId) {
        delete newConfig[agentId]
      } else {
        newConfig[agentId] = nextAgentId
      }
      return newConfig
    })
  }

  const handleSaveFlow = async () => {
    setError("")
    setSuccess("")
    setSaving(true)

    try {
      const response = await fetch("/api/admin/agents/update-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowConfig }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar fluxo")
      }

      setSuccess("Fluxo de agentes atualizado com sucesso!")
      setTimeout(() => loadAgents(), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar fluxo")
    } finally {
      setSaving(false)
    }
  }

  const getFlowChains = (): Agent[][] => {
    const chains: Agent[][] = []
    const visited = new Set<string>()

    // Encontra agentes iniciais (não são next_agent de ninguém)
    const nextAgentIds = new Set(Object.values(flowConfig))
    const startAgents = agents.filter((agent) => !nextAgentIds.has(agent.id) && agent.status === "active")

    for (const startAgent of startAgents) {
      if (visited.has(startAgent.id)) continue

      const chain: Agent[] = []
      let current: Agent | undefined = startAgent

      while (current && !visited.has(current.id)) {
        chain.push(current)
        visited.add(current.id)

        const nextAgentId = flowConfig[current.id]
        current = nextAgentId ? agents.find((a) => a.id === nextAgentId) : undefined
      }

      if (chain.length > 0) {
        chains.push(chain)
      }
    }

    return chains
  }

  const chains = getFlowChains()

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/agents">
              <Button variant="ghost" size="sm">
                ← Voltar
              </Button>
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight mt-2">Workflow de Agentes IA</h2>
          <p className="text-muted-foreground">Configure o fluxo de execução sequencial dos agentes</p>
        </div>
        <Button onClick={handleSaveFlow} disabled={saving || agents.length === 0}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Workflow
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground opacity-50 mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhum agente disponível. Importe assistentes da OpenAI primeiro.
            </p>
            <Link href="/admin/agents">
              <Button className="mt-4">Ir para Gerenciar Agentes</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuração Individual */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuração Individual</CardTitle>
                <CardDescription>Defina o próximo agente para cada etapa do fluxo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents
                  .filter((a) => a.status === "active")
                  .map((agent, index) => (
                    <div key={agent.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{agent.name}</h4>
                          {agent.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 ml-11">
                        <Label htmlFor={`flow-${agent.id}`} className="text-xs">
                          Próximo Agente
                        </Label>
                        <Select
                          value={flowConfig[agent.id] || "none"}
                          onValueChange={(value) => updateFlowConfig(agent.id, value)}
                        >
                          <SelectTrigger id={`flow-${agent.id}`} className="h-9">
                            <SelectValue placeholder="Selecione o próximo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum (fim do fluxo)</SelectItem>
                            {agents
                              .filter((a) => a.id !== agent.id && a.status === "active")
                              .map((a) => (
                                <SelectItem key={a.id} value={a.id}>
                                  {a.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Visualização do Fluxo */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Visualização do Workflow</CardTitle>
                <CardDescription>Fluxo completo de execução dos agentes</CardDescription>
              </CardHeader>
              <CardContent>
                {chains.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure o fluxo na coluna ao lado</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chains.map((chain, chainIndex) => (
                      <div key={chainIndex} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Fluxo {chainIndex + 1} ({chain.length} etapas)
                        </h4>
                        <div className="space-y-2">
                          {chain.map((agent, stepIndex) => (
                            <div key={agent.id}>
                              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                                  {stepIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{agent.name}</p>
                                  {agent.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
                                  )}
                                </div>
                              </div>
                              {stepIndex < chain.length - 1 && (
                                <div className="flex justify-center py-1">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
