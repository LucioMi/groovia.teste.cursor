"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganization } from "@/lib/organization-context"

const ActivityIcon = () => (
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
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
  </svg>
)

const PlusIcon = () => (
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
    <path d="M5 12h14"></path>
    <path d="M12 5v14"></path>
  </svg>
)

const Trash2Icon = () => (
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
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    <line x1="10" x2="10" y1="11" y2="17"></line>
    <line x1="14" x2="14" y1="11" y2="17"></line>
  </svg>
)

interface Webhook {
  id: string
  url: string
  event_type: string
  is_active: boolean
  created_at: string
  agent_id: string
}

export default function WebhooksPage() {
  const { currentOrganization } = useOrganization()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newWebhook, setNewWebhook] = useState({ url: "", event_type: "agent.completed", agent_id: "" })

  useEffect(() => {
    if (currentOrganization) {
      fetchWebhooks()
    }
  }, [currentOrganization])

  const fetchWebhooks = async () => {
    try {
      console.log("[v0] Fetching webhooks for organization:", currentOrganization?.id)
      const response = await fetch("/api/webhooks")
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching webhooks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWebhook = async () => {
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      })

      if (response.ok) {
        await fetchWebhooks()
        setShowForm(false)
        setNewWebhook({ url: "", event_type: "agent.completed", agent_id: "" })
      }
    } catch (error) {
      console.error("[v0] Error creating webhook:", error)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchWebhooks()
      }
    } catch (error) {
      console.error("[v0] Error deleting webhook:", error)
    }
  }

  const availableEvents = [
    { id: "agent.completed", label: "Agente Concluído" },
    { id: "agent.failed", label: "Agente Falhou" },
    { id: "agent.started", label: "Agente Iniciado" },
    { id: "session.created", label: "Sessão Criada" },
  ]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#7C3AED] mx-auto mb-4" />
          <p className="text-gray-600">Carregando webhooks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#7C3AED] mb-2">Webhooks</h1>
        <p className="text-gray-600">Receba notificações em tempo real sobre eventos da plataforma</p>
      </div>

      <div className="mb-6">
        <Button onClick={() => setShowForm(!showForm)}>
          <PlusIcon />
          <span className="ml-2">{showForm ? "Cancelar" : "Novo Webhook"}</span>
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Criar Novo Webhook</CardTitle>
            <CardDescription>Configure um endpoint para receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Endpoint</Label>
              <Input
                id="url"
                placeholder="https://api.exemplo.com/webhooks"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event">Tipo de Evento</Label>
              <select
                id="event"
                value={newWebhook.event_type}
                onChange={(e) => setNewWebhook({ ...newWebhook, event_type: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {availableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.label}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={handleCreateWebhook} disabled={!newWebhook.url}>
              Criar Webhook
            </Button>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 text-gray-400">
            <ActivityIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum webhook configurado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro webhook para começar a receber notificações</p>
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon />
            <span className="ml-2">Criar Webhook</span>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{webhook.url}</CardTitle>
                    <CardDescription className="mt-1">
                      {webhook.event_type} · Criado em {new Date(webhook.created_at).toLocaleDateString("pt-BR")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        webhook.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {webhook.is_active ? "Ativo" : "Inativo"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteWebhook(webhook.id)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
