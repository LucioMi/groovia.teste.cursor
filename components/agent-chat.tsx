"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Mic, FileText, Loader2, MessageSquare, X, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  created_at?: string
  attachments?: Array<{ url: string; name: string; type: string; preview?: string }>
}

interface AgentChatProps {
  agentId: string
  conversationId: string
  agentName: string
  onDocumentUpdate?: (content: string) => void
  onMessageSent?: () => void
}

export function AgentChat({ agentId, conversationId, agentName, onDocumentUpdate, onMessageSent }: AgentChatProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; name: string; type: string; preview?: string }>
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    loadMessageHistory()
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()
    if (lastAssistantMessage && onDocumentUpdate) {
      onDocumentUpdate(lastAssistantMessage.content)
    }
  }, [messages, onDocumentUpdate])

  const loadMessageHistory = async () => {
    try {
      setIsLoadingHistory(true)
      console.log("[v0] Loading message history for conversation:", conversationId)

      const response = await fetch(`/api/agents/${agentId}/conversations/${conversationId}/messages`)

      if (!response.ok) {
        console.error("[v0] Failed to load messages:", response.status)
        return
      }

      const data = await response.json()
      console.log("[v0] Loaded messages:", data.length)
      setMessages(data || [])
    } catch (error) {
      console.error("[v0] Error loading message history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && uploadedFiles.length === 0) return
    if (isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
      attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    const currentAttachments = [...uploadedFiles]
    setUploadedFiles([])
    setIsLoading(true)

    try {
      console.log("[v0] Sending message to agent...")

      abortControllerRef.current = new AbortController()

      const response = await fetch(`/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            {
              role: "user",
              content: userMessage.content,
              id: userMessage.id,
              attachments: currentAttachments,
            },
          ],
          conversationId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantContent += chunk

          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
          )
        }
      }

      console.log("[v0] Message sent successfully")

      if (onMessageSent) {
        onMessageSent()
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("[v0] Request cancelled")
      } else {
        console.error("[v0] Error sending message:", error)
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
        alert("Erro ao enviar mensagem. Por favor, tente novamente.")
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`Arquivo ${file.name} é muito grande. Tamanho máximo: 10MB`)
        continue
      }

      let preview: string | undefined
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file)
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Upload failed")
        }

        const data = await response.json()
        setUploadedFiles((prev) => [
          ...prev,
          {
            url: data.url,
            name: file.name,
            type: file.type,
            preview,
          },
        ])
      } catch (error) {
        console.error("[v0] Error uploading file:", error)
        alert(`Erro ao fazer upload do arquivo ${file.name}`)
      }
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: "audio/webm" })

          const formData = new FormData()
          formData.append("file", audioFile)

          try {
            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (response.ok) {
              const data = await response.json()
              setUploadedFiles((prev) => [
                ...prev,
                {
                  url: data.url,
                  name: audioFile.name,
                  type: "audio/webm",
                },
              ])
            }
          } catch (error) {
            console.error("[v0] Error uploading audio:", error)
            alert("Erro ao fazer upload do áudio")
          }

          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        console.log("[v0] Audio recording started")
      } catch (error) {
        console.error("[v0] Error starting recording:", error)
        alert("Erro ao acessar o microfone. Verifique as permissões.")
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        console.log("[v0] Audio recording stopped")
      }
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => {
      const file = prev[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-white p-3 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full min-h-[300px] sm:min-h-[400px] items-center justify-center">
              <div className="text-center px-4">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 text-purple-200" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Inicie uma conversa</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Converse com <strong className="text-purple-600">{agentName}</strong> para começar
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <Card
                className={cn(
                  "max-w-[85%] sm:max-w-[80%] p-3 sm:p-4 shadow-sm",
                  message.role === "user"
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-900 border-gray-200",
                )}
              >
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {message.attachments.map((file, idx) => (
                      <div key={idx}>
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.url || "/placeholder.svg"}
                            alt={file.name}
                            className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                          />
                        ) : file.type.startsWith("audio/") ? (
                          <div className="flex items-center gap-2 p-2 rounded bg-black/10">
                            <Volume2 className="h-4 w-4" />
                            <audio controls src={file.url} className="flex-1 max-w-full">
                              Seu navegador não suporta áudio
                            </audio>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs p-2 rounded bg-black/10">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">{message.content}</div>
                {message.created_at && (
                  <div className={cn("mt-2 text-xs", message.role === "user" ? "text-purple-200" : "text-gray-500")}>
                    {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </Card>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-white border-gray-200 p-3 sm:p-4 shadow-sm max-w-[85%] sm:max-w-none">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="font-medium">{agentName} está escrevendo...</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelRequest}
                    className="h-6 text-xs text-red-600 hover:text-red-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-3 sm:p-4">
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith("image/") && file.preview ? (
                  <div className="relative">
                    <img
                      src={file.preview || "/placeholder.svg"}
                      alt={file.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-sm text-purple-700 pr-8 max-w-[200px] sm:max-w-none">
                    {file.type.startsWith("audio/") ? (
                      <Volume2 className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[60px] resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 640) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
          </div>

          <div className="flex gap-2 justify-end sm:justify-start">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,audio/*"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50 flex-shrink-0"
              title="Anexar arquivo ou imagem"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleRecording}
              disabled={isLoading}
              className={cn(
                "border-gray-300 hover:bg-gray-50 flex-shrink-0",
                isRecording && "bg-red-50 text-red-600 border-red-300 animate-pulse",
              )}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
              className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
