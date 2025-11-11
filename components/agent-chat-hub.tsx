"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Mic, FileText, Loader2, ThumbsUp, Edit, Download, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AgentChatHubProps {
  agentId: string
  conversationId: string
  agentName: string
  onDocumentUpdate?: (content: string) => void
  onMessageSent?: () => void
}

interface MessageFeedback {
  [messageId: string]: "approved" | "needs_edit" | null
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string
}

export function AgentChat({ agentId, conversationId, agentName, onDocumentUpdate, onMessageSent }: AgentChatHubProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([])
  const [messageFeedback, setMessageFeedback] = useState<MessageFeedback>({})
  const [approvedCount, setApprovedCount] = useState(0)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) {
        setIsLoadingMessages(false)
        setMessages([])
        return
      }

      setIsLoadingMessages(true)
      try {
        console.log("[v0] Fetching messages for conversation:", conversationId)
        const response = await fetch(`/api/agents/${agentId}/conversations/${conversationId}`)
        const data = await response.json()

        console.log("[v0] Fetched messages:", data.messages?.length || 0)
        setMessages(data.messages || [])
      } catch (error) {
        console.error("[v0] Error fetching messages:", error)
        setMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [conversationId, agentId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()
    if (lastAssistantMessage && onDocumentUpdate) {
      onDocumentUpdate(lastAssistantMessage.content)
    }
  }, [messages, onDocumentUpdate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && uploadedFiles.length === 0) return
    if (isSending) return

    let messageContent = input
    if (uploadedFiles.length > 0) {
      messageContent += `\n\nArquivos anexados:\n${uploadedFiles.map((f) => `- ${f.name}: ${f.url}`).join("\n")}`
    }

    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: messageContent,
    }
    setMessages((prev) => [...prev, tempUserMessage])
    setInput("")
    setUploadedFiles([])
    setIsSending(true)

    try {
      console.log("[v0] Sending message to agent:", agentId)
      console.log("[v0] Conversation ID:", conversationId)
      console.log("[v0] Message count:", messages.length + 1)

      const allMessages = [...messages, tempUserMessage].map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }))

      console.log("[v0] Prepared messages:", allMessages.length)

      const url = `/api/agents/${agentId}/chat`
      console.log("[v0] Fetching URL:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: allMessages,
        }),
      })

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorData
        const contentType = response.headers.get("content-type")
        console.log("[v0] Error response content-type:", contentType)

        if (contentType?.includes("application/json")) {
          errorData = await response.json()
        } else {
          const text = await response.text()
          console.log("[v0] Error response text:", text)
          errorData = { error: text || "Unknown error" }
        }

        console.error("[v0] Server error response:", errorData)
        throw new Error(errorData.error || errorData.details || "Failed to send message")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body reader available")
      }

      const decoder = new TextDecoder()
      let assistantResponse = ""
      const assistantId = `assistant-${Date.now()}`

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantResponse += chunk

        // Update UI in real-time with accumulated response
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id)
          const existingAssistant = withoutTemp.find((m) => m.id === assistantId)

          if (existingAssistant) {
            return withoutTemp.map((m) => (m.id === assistantId ? { ...m, content: assistantResponse } : m))
          } else {
            return [
              ...withoutTemp,
              {
                id: tempUserMessage.id.replace("temp-", ""),
                role: "user",
                content: messageContent,
              },
              {
                id: assistantId,
                role: "assistant",
                content: assistantResponse,
              },
            ]
          }
        })
      }

      onMessageSent?.()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))

      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      alert(`Erro ao enviar mensagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const data = await response.json()
        setUploadedFiles((prev) => [...prev, { url: data.url, name: file.name }])
      } catch (error) {
        console.error("[v0] Error uploading file:", error)
      }
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
  }

  const handleFeedback = async (messageId: string, feedbackType: "approved" | "needs_edit") => {
    console.log("[v0] Feedback:", { messageId, feedbackType })

    const messageIndex = messages.findIndex((m) => m.id === messageId)
    const message = messages[messageIndex]
    const previousUserMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find((m) => m.role === "user")

    const question = previousUserMessage?.content || "Pergunta não encontrada"
    const response = message.content

    try {
      const res = await fetch(`/api/agents/${agentId}/messages/${messageId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackType,
          conversationId,
          question,
          response,
        }),
      })

      if (res.ok) {
        setMessageFeedback((prev) => ({ ...prev, [messageId]: feedbackType }))
        if (feedbackType === "approved") {
          setApprovedCount((prev) => prev + 1)
        }
      }
    } catch (error) {
      console.error("[v0] Error saving feedback:", error)
    }
  }

  const generateFinalDocument = async () => {
    setIsGeneratingDoc(true)
    try {
      const res = await fetch(`/api/agents/${agentId}/conversations/${conversationId}/document`)
      const data = await res.json()

      if (data.success) {
        const blob = new Blob([data.document], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `documento-final-${agentName}-${new Date().toISOString().split("T")[0]}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        console.log("[v0] Document generated and downloaded")
      }
    } catch (error) {
      console.error("[v0] Error generating document:", error)
    } finally {
      setIsGeneratingDoc(false)
    }
  }

  if (isLoadingMessages) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-gray-500">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-sm">Carregando mensagens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <TooltipProvider>
        <div className="border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-medium text-gray-400">Progresso da Conversa</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{approvedCount}</span>
                  <span className="text-sm text-gray-500">respostas aprovadas</span>
                </div>
              </div>
            </div>
            {approvedCount > 0 && (
              <Button
                onClick={generateFinalDocument}
                disabled={isGeneratingDoc}
                size="sm"
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/20 transition-all hover:from-green-700 hover:to-emerald-700"
              >
                {isGeneratingDoc ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Baixar Documento Final
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 ring-1 ring-white/10">
                    <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-white">Inicie uma conversa</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Converse com <span className="font-semibold text-gray-400">{agentName}</span> para começar
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {message.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-w-[75%]">
                    <div
                      className={cn(
                        "rounded-2xl px-5 py-3 shadow-lg transition-all",
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-600/20"
                          : "bg-gray-800/80 text-gray-100 shadow-gray-900/50 backdrop-blur-sm ring-1 ring-white/5",
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>

                    {message.role === "assistant" && !message.id.startsWith("temp-") && (
                      <div className="flex items-center gap-2 px-2">
                        {messageFeedback[message.id] === "approved" ? (
                          <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Aprovado</span>
                          </div>
                        ) : messageFeedback[message.id] === "needs_edit" ? (
                          <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">
                            <Edit className="h-3.5 w-3.5" />
                            <span>Precisa editar</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFeedback(message.id, "approved")}
                                  className="h-8 gap-2 rounded-full bg-green-500/10 px-3 text-green-400 hover:bg-green-500/20 hover:text-green-300"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">Aprovar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Aprovar resposta</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleFeedback(message.id, "needs_edit")}
                                  className="h-8 gap-2 rounded-full bg-amber-500/10 px-3 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">Editar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Precisa alterar</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/20 ring-2 ring-white/10">
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 ring-2 ring-white/10">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div className="rounded-2xl bg-gray-800/80 px-5 py-3 shadow-lg backdrop-blur-sm ring-1 ring-white/5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                        ●
                      </span>
                      <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                        ●
                      </span>
                      <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                        ●
                      </span>
                    </div>
                    <span className="font-medium">agente escrevendo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm p-4">
          <div className="mx-auto max-w-4xl">
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-2 rounded-lg bg-gray-800/80 px-3 py-2 text-sm text-gray-300 ring-1 ring-white/5 transition-all hover:bg-gray-800"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <button
                      onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                      className="ml-1 rounded-full p-1 text-gray-500 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-[56px] resize-none rounded-2xl border-gray-700/50 bg-gray-800/50 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-12 w-12 rounded-xl border-gray-700/50 bg-gray-800/50 text-gray-400 transition-all hover:bg-gray-800 hover:text-white hover:ring-2 hover:ring-blue-500/20"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Anexar arquivo</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={toggleRecording}
                      className={cn(
                        "h-12 w-12 rounded-xl border-gray-700/50 bg-gray-800/50 text-gray-400 transition-all hover:bg-gray-800 hover:text-white hover:ring-2 hover:ring-blue-500/20",
                        isRecording && "bg-red-500/20 text-red-400 ring-2 ring-red-500/50 hover:bg-red-500/30",
                      )}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isRecording ? "Parar gravação" : "Gravar áudio"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || (!input.trim() && uploadedFiles.length === 0)}
                      className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-blue-600/30 disabled:opacity-50 disabled:shadow-none"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar mensagem</TooltipContent>
                </Tooltip>
              </div>
            </form>
          </div>
        </div>
      </TooltipProvider>
    </div>
  )
}
