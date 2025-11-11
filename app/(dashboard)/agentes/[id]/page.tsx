"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Clock,
  Plus,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Bot,
  Trash2,
  FileText,
  Check,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AgentChat } from "@/components/agent-chat"
import { DocumentPreview } from "@/components/document-preview"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils" // Import cn for conditional class names

interface Agent {
  id: string
  name: string
  description: string
  category: string
  status: string
  openai_assistant_id?: string
}

interface Conversation {
  id: string
  title: string
  message_count: number
  last_message_at: string
  created_at: string
}

interface OpenAIAssistant {
  id: string
  name: string
  description: string
  model: string
  instructions: string
  tools: Array<{ type: string }>
  created_at: number
}

export default function AgentHubPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [documentContent, setDocumentContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [editingDocument, setEditingDocument] = useState(false)
  const [editedDocumentContent, setEditedDocumentContent] = useState("")
  const [conversationProgress, setConversationProgress] = useState(0)
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchAgent()
      fetchConversations()
      fetchAllAgents()
    }
  }, [params.id, retryCount])

  useEffect(() => {
    if (agent && conversations.length === 0 && !selectedConversation && !loading) {
      console.log("[v0] No conversations found, auto-creating first conversation")
      createNewConversation()
    }
  }, [agent, conversations.length, selectedConversation, loading])

  const fetchAgent = async () => {
    try {
      const cacheBuster = Date.now()
      const response = await fetch(`/api/agents/${params.id}?t=${cacheBuster}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("[v0] Fetch agent response status:", response.status)

      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json()
          console.error("[v0] Agent not found:", params.id)
          console.error("[v0] Available agents:", errorData.availableAgents)

          if (errorData.availableAgents && errorData.availableAgents.length > 0) {
            setAllAgents(errorData.availableAgents)
          }

          setError("Agente não encontrado")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("[v0] Agent data received:", data.agent ? `${data.agent.name} (${data.agent.id})` : "null")

      if (!data.agent) {
        setError("Agente não encontrado")
        console.error("[v0] No agent in response")
        return
      }
      setAgent(data.agent)
      setError(null)
    } catch (error) {
      console.error("[v0] Error fetching agent:", error)
      setError("Erro ao carregar agente")
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/agents/${params.id}/conversations`)
      const data = await response.json()
      const validConversations = (data.conversations || []).filter((c: any) => c && c.id)
      setConversations(validConversations)
    } catch (error) {
      console.error("[v0] Error fetching conversations:", error)
      setConversations([])
    }
  }

  const fetchAllAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()
      setAllAgents(data.agents || [])
    } catch (error) {
      console.error("[v0] Error fetching agents:", error)
    }
  }

  const createNewConversation = async () => {
    try {
      console.log("[v0] Creating new conversation for agent:", params.id)
      const response = await fetch(`/api/agents/${params.id}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nova Conversa" }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error creating conversation:", errorData)
        alert(`Erro ao criar conversa: ${errorData.error || "Erro desconhecido"}`)
        return
      }
      const data = await response.json()
      if (!data.conversation || !data.conversation.id) {
        console.error("[v0] No conversation in response:", data)
        alert("Erro ao criar conversa: resposta inválida do servidor")
        return
      }
      console.log("[v0] Conversation created successfully:", data.conversation.id)
      setConversations([data.conversation, ...conversations])
      setSelectedConversation(data.conversation.id)
    } catch (error) {
      console.error("[v0] Error creating conversation:", error)
      alert("Erro ao criar conversa. Por favor, tente novamente.")
    }
  }

  const validateDocument = async () => {
    if (!documentContent) {
      alert("Nenhum documento para validar")
      return
    }

    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: params.id,
          name: `${agent?.name} - Documento Final`,
          content: documentContent,
          user_id: "current-user",
        }),
      })

      alert("Documento validado e salvo com sucesso!")
    } catch (error) {
      console.error("[v0] Error saving document:", error)
      alert("Erro ao salvar documento")
    }
  }

  const goToNextAgent = () => {
    const currentIndex = allAgents.findIndex((a) => a.id === params.id)
    if (currentIndex < allAgents.length - 1) {
      const nextAgent = allAgents[currentIndex + 1]
      router.push(`/dashboard/agentes/${nextAgent.id}`)
    } else {
      alert("Este é o último agente do workflow!")
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      console.log("[v0] Deleting conversation:", conversationId)
      const response = await fetch(`/api/agents/${params.id}/conversations/${conversationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete conversation")
      }

      console.log("[v0] Conversation deleted successfully")

      setConversations(conversations.filter((c) => c.id !== conversationId))

      if (selectedConversation === conversationId) {
        setSelectedConversation(null)
      }

      alert("Conversa excluída com sucesso!")
    } catch (error) {
      console.error("[v0] Error deleting conversation:", error)
      alert("Erro ao excluir conversa. Por favor, tente novamente.")
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)
    setLoading(true)
    setError(null)
    setRetryCount((prev) => prev + 1)
  }

  const handleHardRefresh = () => {
    window.location.reload()
  }

  const handleDocumentComplete = () => {
    if (!documentContent) {
      alert("Nenhum documento foi gerado ainda")
      return
    }
    setEditedDocumentContent(documentContent)
    setShowDocumentModal(true)
  }

  const handleApproveDocument = async () => {
    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: params.id,
          name: `${agent?.name} - Documento Final`,
          content: editedDocumentContent,
          user_id: "current-user",
        }),
      })

      alert("Documento aprovado e salvo em Empresa!")
      setShowDocumentModal(false)

      await markStepComplete()
      goToNextAgent()
    } catch (error) {
      console.error("[v0] Error approving document:", error)
      alert("Erro ao aprovar documento")
    }
  }

  const markStepComplete = async () => {
    try {
      await fetch("/api/journey/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: params.id,
          completed: true,
        }),
      })
    } catch (error) {
      console.error("[v0] Error marking step complete:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          {isRetrying && <p className="mt-4 text-sm text-gray-600">Tentando novamente...</p>}
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4">
        <div className="max-w-2xl text-center">
          <Bot className="mx-auto mb-6 h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{error || "Agente não encontrado"}</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-2">
            O agente que você está procurando não existe ou foi removido.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 break-all">
            ID solicitado: <code className="rounded bg-gray-100 px-2 py-1 text-xs">{params.id}</code>
          </p>

          {allAgents.length > 0 && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
              <h2 className="mb-4 text-base sm:text-lg font-semibold text-gray-900">Agentes Disponíveis:</h2>
              <div className="grid gap-2">
                {allAgents.slice(0, 5).map((agent) => (
                  <Button
                    key={agent.id}
                    onClick={() => router.push(`/dashboard/agentes/${agent.id}`)}
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <Bot className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{agent.name}</span>
                    <span className="ml-auto text-xs text-gray-500">{agent.id.slice(0, 8)}...</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              {isRetrying ? "Tentando..." : "Tentar Novamente"}
            </Button>
            <Button onClick={handleHardRefresh} variant="outline">
              Atualizar Página
            </Button>
            <Button
              onClick={() => router.push("/dashboard/agentes")}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Ver Todos os Agentes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {agent?.name || "Intelligence Hub"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {agent?.description || "AI-powered conversations and strategic insights"}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                variant="outline"
                size="icon"
                className="lg:hidden"
              >
                {showMobileSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <Button onClick={createNewConversation} className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Conversa</span>
              </Button>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 sm:px-4 py-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900">Progresso da Conversa</p>
                <p className="text-xs text-gray-600">{conversationProgress} respostas aprovadas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {selectedConversation ? (
            <>
              <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                <div className="flex-1 overflow-hidden">
                  <AgentChat
                    agentId={params.id as string}
                    conversationId={selectedConversation}
                    agentName={agent?.name || "Agent"}
                    onDocumentUpdate={setDocumentContent}
                    onMessageSent={fetchConversations}
                  />
                </div>

                {documentContent && (
                  <div className="border-t border-gray-200 bg-white p-3 sm:p-4 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleDocumentComplete}
                        className="flex-1 gap-2 bg-purple-600 text-white hover:bg-purple-700"
                      >
                        <FileText className="h-4 w-4" />
                        Documento Final
                      </Button>
                      <Button
                        onClick={goToNextAgent}
                        className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                      >
                        Próximo Agente
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "w-full lg:w-96 border-l border-gray-200 bg-gray-50 flex-shrink-0",
                  "absolute lg:relative inset-0 lg:inset-auto z-50 lg:z-auto",
                  "transition-transform duration-300",
                  showMobileSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0",
                )}
              >
                <div className="border-b border-gray-200 bg-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Documento</h3>
                      <p className="text-xs text-gray-600">
                        {documentContent ? "Em construção" : "Aguardando conteúdo"}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowMobileSidebar(false)} variant="ghost" size="icon" className="lg:hidden">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <DocumentPreview content={documentContent} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="text-center">
                <MessageSquare className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12 text-gray-300" />
                <p className="text-sm sm:text-base text-gray-500">Selecione uma conversa para continuar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-40">
        {showWorkflowPanel ? (
          <Card className="w-80 sm:w-96 max-w-[calc(100vw-2rem)] border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-200 p-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Continue Workflow</h3>
                <p className="text-xs text-gray-600">Retomar conversas anteriores</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowWorkflowPanel(false)} className="h-6 w-6">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto p-3">
              <div className="space-y-2">
                {conversations
                  .filter((c) => c && c.id && c.title)
                  .slice(0, 3)
                  .map((conversation) => (
                    <Card
                      key={conversation.id}
                      className="border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSelectedConversation(conversation.id)
                        setShowWorkflowPanel(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{conversation.title}</h4>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{conversation.message_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {conversation.last_message_at
                                  ? new Date(conversation.last_message_at).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-gray-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conversation.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                {conversations.length === 0 && (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
                    <p className="text-xs text-gray-500">Nenhuma conversa ainda</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Button
            onClick={() => setShowWorkflowPanel(true)}
            className="gap-2 bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Conversas ({conversations.length})</span>
            <span className="sm:hidden">{conversations.length}</span>
            <ChevronUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 text-base sm:text-lg">
              <FileText className="h-5 w-5 text-purple-600" />
              Documento Final - Revisão
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm">
              Revise o documento gerado. Você pode ajustar o conteúdo ou aprovar para salvar em Empresa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingDocument ? (
              <div className="space-y-3">
                <Textarea
                  value={editedDocumentContent}
                  onChange={(e) => setEditedDocumentContent(e.target.value)}
                  className="min-h-[300px] sm:min-h-[400px] font-mono text-xs sm:text-sm"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => setEditingDocument(false)} variant="outline" className="flex-1">
                    Cancelar Edição
                  </Button>
                  <Button
                    onClick={() => {
                      setDocumentContent(editedDocumentContent)
                      setEditingDocument(false)
                    }}
                    className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-900">{editedDocumentContent}</pre>
                </div>
              </div>
            )}

            {!editingDocument && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setEditingDocument(true)} variant="outline" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Ajustar
                </Button>
                <Button
                  onClick={handleApproveDocument}
                  className="flex-1 gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
