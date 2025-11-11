"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Paperclip, Send, ImageIcon, X, Loader2, ArrowLeft, Menu, Mic, MicOff, ThumbsUp, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"

interface Agent {
  id: string
  name: string
  description: string
  next_agent_id?: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: Date
}

export default function AgentChatPage() {
  const params = useParams()
  const agentId = (params?.id as string) || ""
  const router = useRouter()

  console.log("[v0] Component mounted with agentId:", agentId)

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loadingAgent, setLoadingAgent] = useState(true)
  const [attachments, setAttachments] = useState<File[]>([])
  const [showSidebar, setShowSidebar] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [approvedMessages, setApprovedMessages] = useState<Set<string>>(new Set())
  const [generatingDocument, setGeneratingDocument] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<"idle" | "in_progress">("idle")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const chatEnabled = agentId && agentId !== "" && agentId !== "undefined"

  useEffect(() => {
    if (agentId && agentId !== "undefined") {
      loadAgentAndHistory()
    } else {
      setLoadingAgent(false)
      setLoadingHistory(false)
    }
  }, [agentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadAgentAndHistory() {
    if (!agentId || agentId === "undefined") {
      console.error("[v0] Invalid agent ID:", agentId)
      setError("ID do agente inválido")
      setLoadingAgent(false)
      setLoadingHistory(false)
      return
    }

    try {
      console.log("[v0] Loading agent and history for:", agentId)

      const [agentRes, convRes] = await Promise.all([
        fetch(`/api/agents/${agentId}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/agents/${agentId}/conversations`, {
          cache: "no-store",
          credentials: "include",
        }),
      ])

      console.log("[v0] Agent API status:", agentRes.status)
      console.log("[v0] Conversations API status:", convRes.status)

      if (!agentRes.ok) {
        const errorData = await agentRes.json().catch(() => ({}))
        console.error("[v0] Agent API error:", errorData)
        throw new Error(errorData.error || `Erro ${agentRes.status}: Agente não encontrado`)
      }

      const agentData = await agentRes.json()
      console.log("[v0] Agent loaded:", agentData.name)
      setAgent(agentData)

      if (convRes.ok) {
        const convData = await convRes.json()
        console.log("[v0] Conversations response:", convData)

        if (convData.conversationId) {
          setConversationId(convData.conversationId)
          console.log("[v0] Set conversation ID:", convData.conversationId)

          if (convData.messages && convData.messages.length > 0 && !historyLoaded) {
            console.log("[v0] Loading", convData.messages.length, "messages from history")

            const formattedMessages = convData.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: new Date(msg.created_at),
            }))

            console.log("[v0] Formatted messages for display:", formattedMessages.length)

            setMessages(formattedMessages)
            setHistoryLoaded(true)

            console.log("[v0] History loaded successfully")
          } else {
            console.log("[v0] No messages or already loaded")
          }
        } else {
          console.log("[v0] No existing conversation, will create on first message")
        }
      }
    } catch (error) {
      console.error("[v0] Error loading agent and history:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar agente")
    } finally {
      setLoadingAgent(false)
      setLoadingHistory(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()

    if (!input.trim() || status === "in_progress" || !agentId) {
      console.log("[v0] Cannot send: empty input, in progress, or no agentId")
      return
    }

    const tempMessageId = Math.random().toString(36).substring(7)

    const userMessage: Message = {
      id: tempMessageId,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setStatus("in_progress")

    const endpoint = `/api/agents/${agentId}/chat`
    console.log("[v0] Sending message to:", endpoint)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId: conversationId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newConversationId = response.headers.get("x-conversation-id")
      if (newConversationId && newConversationId !== conversationId) {
        console.log("[v0] Received conversation ID:", newConversationId)
        setConversationId(newConversationId)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""
      const tempAssistantId = Math.random().toString(36).substring(7)
      let realUserMessageId: string | null = null
      let realAssistantMessageId: string | null = null

      setMessages((prev) => [
        ...prev,
        {
          id: tempAssistantId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
        },
      ])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              const text = line.substring(2).trim()
              if (text) {
                try {
                  assistantMessage += JSON.parse(text)
                } catch {
                  assistantMessage += text
                }

                setMessages((prev) =>
                  prev.map((m) => (m.id === tempAssistantId ? { ...m, content: assistantMessage } : m)),
                )
              }
            } else if (line.startsWith("2:")) {
              try {
                const dataText = line.substring(2).trim()
                if (dataText.startsWith("[") && dataText.endsWith("]")) {
                  const parsed = JSON.parse(dataText)
                  console.log("[v0] Received metadata from stream:", parsed)

                  if (parsed.conversationId) {
                    setConversationId(parsed.conversationId)
                  }

                  if (parsed.userMessageId && parsed.assistantMessageId) {
                    console.log(
                      "[v0] Updating message IDs - user:",
                      parsed.userMessageId,
                      "assistant:",
                      parsed.assistantMessageId,
                    )
                    realUserMessageId = parsed.userMessageId
                    realAssistantMessageId = parsed.assistantMessageId

                    setMessages((prev) =>
                      prev.map((m) => {
                        if (m.id === tempMessageId) {
                          return { ...m, id: parsed.userMessageId }
                        }
                        if (m.id === tempAssistantId) {
                          return { ...m, id: parsed.assistantMessageId }
                        }
                        return m
                      }),
                    )

                    setApprovedMessages((prev) => {
                      if (prev.has(tempAssistantId)) {
                        const newSet = new Set(prev)
                        newSet.delete(tempAssistantId)
                        newSet.add(parsed.assistantMessageId)
                        console.log(
                          "[v0] Updated approved messages - removed temp ID:",
                          tempAssistantId,
                          "added real ID:",
                          parsed.assistantMessageId,
                        )
                        return newSet
                      }
                      return prev
                    })
                  }
                }
              } catch (e) {
                console.error("[v0] Error parsing stream metadata:", e)
              }
            }
          }
        }
      }

      console.log("[v0] Message completed successfully")
      if (realUserMessageId && realAssistantMessageId) {
        console.log("[v0] Final ID sync - User:", realUserMessageId, "Assistant:", realAssistantMessageId)
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === tempMessageId) return { ...m, id: realUserMessageId }
            if (m.id === tempAssistantId) return { ...m, id: realAssistantMessageId }
            return m
          }),
        )
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Request aborted")
      } else {
        console.error("[v0] Error sending message:", error)
        setMessages((prev) =>
          prev.map((m, idx) =>
            idx === prev.length - 1 && m.role === "assistant"
              ? { ...m, content: "Erro ao enviar mensagem. Tente novamente." }
              : m,
          ),
        )
        alert("Erro ao enviar mensagem: " + error.message)
      }
    } finally {
      setStatus("idle")
      abortControllerRef.current = null
      setAttachments([])
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" })
        setAttachments([...attachments, audioFile])
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      alert("Erro ao acessar microfone. Verifique as permissões.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    console.log("[v0] Uploading", files.length, "file(s) to Blob...")

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch(`/api/agents/${agentId}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload files")
      }

      const result = await response.json()
      console.log("[v0] Files uploaded successfully:", result.files)

      setAttachments([...attachments, ...files])

      alert(`✅ ${result.files.length} arquivo(s) enviado(s) com sucesso!`)
    } catch (error) {
      console.error("[v0] Error uploading files:", error)
      alert("❌ Erro ao enviar arquivos. Tente novamente.")
    }
  }

  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  function toggleMessageApproval(messageId: string) {
    console.log("[v0] Toggling approval for message ID:", messageId)
    console.log("[v0] Current approved messages:", Array.from(approvedMessages))

    setApprovedMessages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
        console.log("[v0] Message REMOVED from approved list:", messageId)
      } else {
        newSet.add(messageId)
        console.log("[v0] Message ADDED to approved list:", messageId)
      }
      console.log("[v0] Total approved messages after toggle:", newSet.size)
      console.log("[v0] New approved message IDs:", Array.from(newSet))
      return newSet
    })
  }

  async function handleGenerateDocument() {
    console.log("[v0] ========== GENERATE DOCUMENT CLICKED ==========")
    console.log("[v0] Conversation ID:", conversationId)
    console.log("[v0] Approved messages count:", approvedMessages.size)
    console.log("[v0] Approved message IDs:", Array.from(approvedMessages))
    console.log(
      "[v0] All messages:",
      messages.map((m) => ({ id: m.id, role: m.role, content: m.content?.substring(0, 50) })),
    )
    console.log(
      "[v0] Assistant messages:",
      messages.filter((m) => m.role === "assistant").map((m) => ({ id: m.id, content: m.content?.substring(0, 50) })),
    )

    if (!conversationId) {
      console.error("[v0] ERROR: No conversation ID!")
      alert("❌ Erro: Nenhuma conversa ativa. Envie uma mensagem primeiro.")
      return
    }

    if (approvedMessages.size === 0) {
      console.error("[v0] ERROR: No approved messages!")
      console.log("[v0] Current approvedMessages Set:", approvedMessages)
      alert("Selecione pelo menos uma resposta para incluir no documento usando o botão 👍")
      return
    }

    if (!agent) {
      console.error("[v0] ERROR: No agent loaded!")
      alert("❌ Erro: Agente não encontrado")
      return
    }

    setGeneratingDocument(true)
    try {
      const payload = {
        conversationId,
        approvedMessageIds: Array.from(approvedMessages),
      }

      console.log("[v0] Sending request to generate document API with payload:", payload)

      const response = await fetch(`/api/agents/${agentId}/generate-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Generate document API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] Generate document API error:", errorData)
        throw new Error(errorData.error || "Erro ao gerar documento")
      }

      const result = await response.json()
      console.log("[v0] Document generated successfully:", result)

      alert(
        `✅ Documento gerado com sucesso!\n\nNome: ${result.documentName}\n\n${approvedMessages.size} resposta(s) incluída(s)`,
      )

      setApprovedMessages(new Set())

      router.push("/dashboard/jornada-scan")
    } catch (error) {
      console.error("[v0] Error generating document:", error)
      alert(error instanceof Error ? error.message : "Erro ao gerar documento. Tente novamente.")
    } finally {
      setGeneratingDocument(false)
    }
  }

  if (loadingAgent || loadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {loadingAgent ? "Carregando agente..." : "Carregando histórico..."}
          </p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="mb-4 text-xl md:text-2xl font-bold text-destructive">Agente não encontrado</h1>
          <p className="mb-2 text-sm md:text-base text-muted-foreground">
            {error || "O agente solicitado não existe ou não está disponível."}
          </p>
          <code className="block my-4 p-2 bg-muted rounded text-xs break-all">ID: {agentId}</code>
          <p className="mb-6 text-xs text-muted-foreground">
            Verifique se o agente está ativo ou tente acessar novamente pela Jornada Scan.
          </p>
          <Button onClick={() => router.push("/dashboard/jornada-scan")} className="w-full md:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Jornada Scan
          </Button>
        </div>
      </div>
    )
  }

  const assistantMessages = messages.filter((m) => m.role === "assistant")

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between p-3 md:p-4 bg-card border-b shrink-0">
        <div className="flex items-center flex-1 gap-2 md:gap-3 min-w-0">
          <Button
            onClick={() => router.push("/dashboard/jornada-scan")}
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 md:h-9 md:w-9 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-xl font-bold text-foreground truncate">{agent.name}</h1>
            <p className="text-xs text-muted-foreground truncate hidden md:block">
              {agent.description ? `${agent.description.substring(0, 100)}...` : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowSidebar(!showSidebar)}
          variant="ghost"
          size="sm"
          className="md:hidden shrink-0 h-8 w-8 p-0"
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 p-3 md:p-6 space-y-3 md:space-y-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 bg-primary/10 rounded-full">
                  <svg
                    className="w-6 h-6 md:w-8 md:h-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-base md:text-lg font-semibold text-foreground truncate">
                  Inicie uma conversa
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">Converse com {agent.name} para começar</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="flex flex-col gap-2 max-w-[90%] md:max-w-[75%] lg:max-w-[65%]">
                    <div
                      className={`rounded-2xl px-3 py-2 md:px-4 md:py-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      {message.content && (
                        <p className="text-sm md:text-base whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-1.5 md:mt-2 ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {new Date(message.createdAt || Date.now()).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {message.role === "assistant" && (
                      <button
                        onClick={() => toggleMessageApproval(message.id)}
                        className={`
                          self-start flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                          transition-all duration-200
                          ${
                            approvedMessages.has(message.id)
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                          }
                        `}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {approvedMessages.has(message.id) ? "Incluído no documento" : "Incluir no documento"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {status === "in_progress" && (
              <div className="flex justify-start">
                <div className="px-3 py-2 md:px-4 md:py-3 bg-muted rounded-2xl">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-primary animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-4 bg-card border-t shrink-0">
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 md:mb-3 overflow-x-auto pb-2 -mx-1 px-1">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-muted rounded-lg shrink-0"
                  >
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    ) : file.type.startsWith("audio/") ? (
                      <Mic className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    ) : (
                      <Paperclip className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                    )}
                    <span className="text-xs md:text-sm text-foreground truncate max-w-[100px] md:max-w-[150px]">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {assistantMessages.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {approvedMessages.size} de {assistantMessages.length} resposta(s) selecionada(s)
                  </span>
                  {approvedMessages.size > 0 && (
                    <button onClick={() => setApprovedMessages(new Set())} className="text-destructive hover:underline">
                      Limpar seleção
                    </button>
                  )}
                </div>
                <Button
                  onClick={handleGenerateDocument}
                  disabled={generatingDocument || approvedMessages.size === 0 || status === "in_progress"}
                  className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  {generatingDocument ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando Documento...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar Documento com Respostas Selecionadas
                    </>
                  )}
                </Button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={status === "in_progress"}
                className="shrink-0 h-11 w-11 md:h-10 md:w-10"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={status === "in_progress"}
                className={`shrink-0 h-11 w-11 md:h-10 md:w-10 ${isRecording ? "bg-red-100 border-red-300" : ""}`}
              >
                {isRecording ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e as any)
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 min-h-[44px] md:min-h-[60px] max-h-[100px] md:max-h-[120px] resize-none text-sm md:text-base"
                disabled={status === "in_progress"}
              />

              <Button
                type="submit"
                disabled={!input.trim() || status === "in_progress"}
                className="shrink-0 h-11 w-11 md:h-10 md:w-10"
                size="icon"
              >
                {status === "in_progress" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>

        <div
          className={`
            fixed md:relative inset-y-0 right-0 z-50
            w-72 md:w-80 
            p-4 md:p-6 
            bg-card border-l 
            transform transition-transform duration-200 ease-in-out
            ${showSidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"}
            ${showSidebar ? "shadow-xl md:shadow-none" : ""}
          `}
        >
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold text-foreground">Informações</h2>
            <Button onClick={() => setShowSidebar(false)} variant="ghost" size="sm" className="md:hidden h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <Card className="p-3 md:p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Mensagens</span>
                <span className="text-sm text-muted-foreground">{messages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Status</span>
                <span className={`text-sm ${status === "in_progress" ? "text-primary" : "text-green-600"}`}>
                  {status === "in_progress" ? "Processando..." : "Pronto"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
      )}
    </div>
  )
}
