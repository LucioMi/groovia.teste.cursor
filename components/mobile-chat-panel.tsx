"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, Mic, ImageIcon, FileText, X, Volume2, Loader2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  attachments?: Attachment[]
}

interface Attachment {
  id: string
  type: "image" | "audio" | "document"
  url: string
  name: string
  size?: number
  preview?: string
}

interface MobileChatPanelProps {
  agentId: string
  agentName: string
  agentAvatar?: string
  onSendMessage?: (message: string, attachments: Attachment[]) => void
}

export function MobileChatPanel({ agentId, agentName, agentAvatar, onSendMessage }: MobileChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSending, setIsSending] = useState(false)
  const [showAttachMenu, setShowAttachMenu] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isSending) return

    const newMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setAttachments([])
    setIsSending(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Recebi sua mensagem: "${input.trim()}". Como posso ajudar você hoje?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
      setIsSending(false)
    }, 1500)

    onSendMessage?.(input.trim(), attachments)
  }

  const handleFileUpload = async (files: FileList, type: "image" | "document") => {
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} é muito grande. Máximo: 10MB`)
        continue
      }

      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined

          setAttachments((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              type: type,
              url: data.url,
              name: file.name,
              size: file.size,
              preview,
            },
          ])
        }
      } catch (error) {
        console.error("Error uploading file:", error)
        alert(`Erro ao enviar ${file.name}`)
      }
    }
    setShowAttachMenu(false)
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
              setAttachments((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  type: "audio",
                  url: data.url,
                  name: audioFile.name,
                  size: audioFile.size,
                },
              ])
            }
          } catch (error) {
            console.error("Error uploading audio:", error)
          }

          stream.getTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        setRecordingTime(0)

        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)
      } catch (error) {
        console.error("Error accessing microphone:", error)
        alert("Não foi possível acessar o microfone")
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop()
        setIsRecording(false)

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }
      }
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id)
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview)
      }
      return prev.filter((a) => a.id !== id)
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-purple-100 bg-white/80 backdrop-blur-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-lg">
              {agentAvatar || agentName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-gray-900">{agentName}</h1>
            <p className="text-xs text-gray-500">Online agora</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center px-6 py-12">
            <div className="space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Comece a conversar</p>
                <p className="text-sm text-gray-600 mt-1">Envie uma mensagem, foto ou áudio</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={cn("flex gap-2 animate-in fade-in slide-in-from-bottom-2", {
              "justify-end": message.role === "user",
              "justify-start": message.role === "assistant",
            })}
            style={{ animationDelay: `${idx * 50}ms`, animationDuration: "300ms" }}
          >
            {message.role === "assistant" && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs font-semibold flex-shrink-0 mt-auto">
                AI
              </div>
            )}

            <div className={cn("max-w-[75%] space-y-1", message.role === "user" && "items-end")}>
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2 mb-1">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.type === "image" && (
                        <div className="overflow-hidden rounded-2xl">
                          <img
                            src={attachment.preview || attachment.url}
                            alt={attachment.name}
                            className="max-w-full h-auto max-h-64 object-cover"
                          />
                        </div>
                      )}
                      {attachment.type === "audio" && (
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-2xl p-3 shadow-sm",
                            message.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200",
                          )}
                        >
                          <Volume2 className="h-4 w-4 flex-shrink-0" />
                          <audio controls src={attachment.url} className="flex-1 h-8">
                            <track kind="captions" />
                          </audio>
                        </div>
                      )}
                      {attachment.type === "document" && (
                        <div
                          className={cn(
                            "flex items-center gap-3 rounded-2xl p-3 shadow-sm",
                            message.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-white text-gray-900 border border-gray-200",
                          )}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{attachment.name}</p>
                            {attachment.size && (
                              <p className="text-xs opacity-80">{(attachment.size / 1024).toFixed(0)} KB</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message content */}
              {message.content && (
                <div
                  className={cn("rounded-2xl px-4 py-2.5 shadow-sm", {
                    "bg-purple-600 text-white": message.role === "user",
                    "bg-white text-gray-900 border border-gray-200": message.role === "assistant",
                  })}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              )}

              <p
                className={cn("text-xs px-1", {
                  "text-gray-500": message.role === "assistant",
                  "text-purple-600": message.role === "user",
                })}
              >
                {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-2 animate-in fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xs font-semibold flex-shrink-0">
              AI
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">Escrevendo...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative flex-shrink-0">
                {attachment.type === "image" && attachment.preview ? (
                  <div className="relative">
                    <img
                      src={attachment.preview || "/placeholder.svg"}
                      alt={attachment.name}
                      className="h-20 w-20 rounded-xl object-cover border-2 border-purple-200"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 rounded-xl border-2 border-purple-200 bg-purple-50 px-3 py-2 pr-8 max-w-[200px]">
                    {attachment.type === "audio" ? (
                      <Volume2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    )}
                    <span className="text-xs text-purple-900 truncate">{attachment.name}</span>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="border-t border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center">
                <Circle className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">Gravando áudio</p>
                <p className="text-xs text-red-600">{formatTime(recordingTime)}</p>
              </div>
            </div>
            <Button
              onClick={toggleRecording}
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700 active:scale-95"
            >
              Parar
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mensagem"
              className="min-h-[48px] max-h-32 resize-none rounded-3xl border-gray-300 pr-12 focus:border-purple-500 focus:ring-purple-500 text-base"
              rows={1}
              disabled={isSending || isRecording}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />

            {/* Attach Button */}
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              disabled={isSending || isRecording}
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 disabled:opacity-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Attach Menu */}
            {showAttachMenu && (
              <div className="absolute bottom-full right-0 mb-2 rounded-2xl bg-white shadow-lg border border-gray-200 p-2 min-w-[160px]">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-purple-50 active:bg-purple-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                    <ImageIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Foto</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Documento</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {input.trim() || attachments.length > 0 ? (
            <Button
              onClick={handleSend}
              disabled={isSending || isRecording}
              size="icon"
              className="h-12 w-12 flex-shrink-0 rounded-full bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-lg disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={toggleRecording}
              disabled={isSending}
              size="icon"
              className={cn(
                "h-12 w-12 flex-shrink-0 rounded-full shadow-lg active:scale-95",
                isRecording ? "bg-red-600 text-white hover:bg-red-700" : "bg-purple-600 text-white hover:bg-purple-700",
              )}
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files, "image")}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files, "document")}
        />
      </div>
    </div>
  )
}
