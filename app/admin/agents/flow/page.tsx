"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface Agent {
  id: string
  name: string
  description: string | null
  status: string
  category: string | null
  next_agent_id: string | null
}

export default function AgentFlowPage() {
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
      const agentList = data.agents || []
      setAgents(agentList)

      const config: Record<string, string> = {}
      agentList.forEach((agent: Agent) => {
        if (agent.next_agent_id) {
          config[agent.id] = agent.next_agent_id
        }
      })
      setFlowConfig(config)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const updateFlowConfig = (agentId: string, nextAgentId: string) => {
    setFlowConfig((prev) => {
      const newConfig = { ...prev }
      if (nextAgentId === "none") {
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
      const updates = agents.map(async (agent) => {
        const next_agent_id = flowConfig[agent.id] || null

        const response = await fetch(`/api/admin/agents/${agent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ next_agent_id }),
        })

        if (!response.ok) {
          throw new Error(`Erro ao atualizar agente ${agent.name}`)
        }
      })

      await Promise.all(updates)

      setSuccess("Fluxo de agentes salvo com sucesso!")
      loadAgents()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar fluxo")
    } finally {
      setSaving(false)
    }
  }

  const getFlowChains = () => {
    const chains: Array<Agent[]> = []
    const visited = new Set<string>()

    agents.forEach((agent) => {
      if (visited.has(agent.id)) return

      const chain: Agent[] = []
      let currentAgent: Agent | undefined = agent

      while (currentAgent && !visited.has(currentAgent.id)) {
        chain.push(currentAgent)
        visited.add(currentAgent.id)

        const nextAgentId = flowConfig[currentAgent.id]
        currentAgent = nextAgentId ? agents.find((a) => a.id === nextAgentId) : undefined
      }

      if (chain.length > 0) {
        chains.push(chain)
      }
    })

    return chains
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const flowChains = getFlowChains()

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurar Fluxo de Agentes</h2>
          <p className="text-muted-foreground">Defina a sequência de execução automática entre os agentes do sistema</p>
        </div>
        <Button onClick={handleSaveFlow} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Fluxo
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
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuração Individual */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração Individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{agent.name}</h4>
                    <Badge variant="outline">{agent.category || "custom"}</Badge>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                  </div>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Próximo Agente no Fluxo</label>
                  <Select
                    value={flowConfig[agent.id] || "none"}
                    onValueChange={(value) => updateFlowConfig(agent.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o próximo agente" />
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

        {/* Visualização do Fluxo */}
        <Card>
          <CardHeader>
            <CardTitle>Visualização do Fluxo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {flowChains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum fluxo configurado ainda</p>
                <p className="text-sm mt-2">Configure os agentes à esquerda para criar fluxos automáticos</p>
              </div>
            ) : (
              flowChains.map((chain, chainIndex) => (
                <div key={chainIndex} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Fluxo {chainIndex + 1}</h4>
                  <div className="space-y-2">
                    {chain.map((agent, index) => (
                      <div key={agent.id}>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{agent.name}</p>
                            {agent.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {agent.category || "custom"}
                          </Badge>
                        </div>
                        {index < chain.length - 1 && (
                          <div className="flex justify-center py-1">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {flowChains.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total de Fluxos</p>
                    <p className="text-2xl font-bold">{flowChains.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Agentes no Fluxo</p>
                    <p className="text-2xl font-bold">{flowChains.reduce((sum, chain) => sum + chain.length, 0)}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Como funciona:</strong> Quando um agente completa sua tarefa, o sistema automaticamente aciona o
          próximo agente configurado no fluxo, criando uma sequência de execução. Agentes podem ser conectados em cadeia
          para criar workflows complexos.
        </AlertDescription>
      </Alert>
    </div>
  )
}
