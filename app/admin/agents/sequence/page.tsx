"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowDown, Save, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Agent {
  id: string
  name: string
  description: string
  next_agent_id: string | null
}

function SortableAgentCard({ agent, index }: { agent: Agent; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: agent.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const shortDescription =
    agent.description?.length > 120 ? agent.description.substring(0, 120) + "..." : agent.description || "Sem descrição"

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 cursor-move hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-6 h-6 text-muted-foreground" />
          </div>

          <div className="bg-primary/10 text-primary font-bold rounded-full w-10 h-10 flex items-center justify-center shrink-0">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{agent.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{shortDescription}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function AgentSequencePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [orderedAgents, setOrderedAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    try {
      const response = await fetch("/api/admin/agents")
      if (!response.ok) throw new Error("Erro ao carregar agentes")

      const data = await response.json()
      const agentList = data.agents || []
      setAgents(agentList)

      const ordered = buildSequence(agentList)
      setOrderedAgents(ordered)
    } catch (error) {
      console.error("Erro ao carregar agentes:", error)
      setMessage("Erro ao carregar agentes")
    } finally {
      setLoading(false)
    }
  }

  function buildSequence(agentList: Agent[]): Agent[] {
    if (agentList.length === 0) return []

    const referencedIds = new Set(agentList.map((a) => a.next_agent_id).filter(Boolean))
    const firstAgent = agentList.find((a) => !referencedIds.has(a.id))

    if (!firstAgent) return agentList

    const sequence: Agent[] = [firstAgent]
    let current = firstAgent

    while (current.next_agent_id) {
      const next = agentList.find((a) => a.id === current.next_agent_id)
      if (!next) break
      sequence.push(next)
      current = next
    }

    const connectedIds = new Set(sequence.map((a) => a.id))
    const unconnected = agentList.filter((a) => !connectedIds.has(a.id))

    return [...sequence, ...unconnected]
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrderedAgents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  async function saveSequence() {
    setSaving(true)
    setMessage("")

    try {
      const updates = orderedAgents.map((agent, index) => {
        const nextAgentId = index < orderedAgents.length - 1 ? orderedAgents[index + 1].id : null
        return {
          id: agent.id,
          next_agent_id: nextAgentId,
        }
      })

      const response = await fetch("/api/admin/agents/update-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      setMessage("✓ Sequência salva com sucesso!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      console.error("Erro ao salvar sequência:", error)
      setMessage("✗ Erro ao salvar sequência: " + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agentes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Configurar Sequência de Agentes</h1>
          <p className="text-muted-foreground mt-2">
            Arraste os cards para reordenar a sequência de execução dos agentes na Jornada Scan.
          </p>
        </div>
        <Button onClick={saveSequence} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Sequência"}
        </Button>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.startsWith("✓") ? "border-green-500" : "border-red-500"}`}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {orderedAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Nenhum agente encontrado. Importe assistentes da OpenAI primeiro.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = "/admin/agents")}>
            Ir para Importação
          </Button>
        </Card>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedAgents.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {orderedAgents.map((agent, index) => (
                <div key={agent.id}>
                  <SortableAgentCard agent={agent} index={index} />
                  {index < orderedAgents.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {orderedAgents.length > 0 && (
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Prévia da Sequência:</h3>
          <p className="text-sm text-muted-foreground">
            {orderedAgents.map((a, i) => `${i + 1}. ${a.name}`).join(" → ")}
          </p>
        </div>
      )}
    </div>
  )
}
