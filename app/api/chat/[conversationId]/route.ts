import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import {
  createThread,
  addMessageToThread,
  runAssistant,
  getRunStatus,
  getThreadMessages,
} from "@/lib/openai-assistants"

export async function POST(request: NextRequest, { params }: { params: { conversationId: string } }) {
  try {
    const { message } = await request.json()
    const conversationId = params.conversationId

    console.log("[v0] Nova mensagem na conversa:", conversationId)

    const supabase = createServerClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar conversa e agente
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select(`
        *,
        agents (
          id,
          name,
          openai_assistant_id,
          model,
          instructions
        )
      `)
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 })
    }

    const agent = conversation.agents

    if (!agent?.openai_assistant_id) {
      return NextResponse.json(
        {
          error: "Agente não está conectado à OpenAI Assistants API",
        },
        { status: 400 },
      )
    }

    // Criar ou recuperar thread
    let threadId = conversation.openai_thread_id

    if (!threadId) {
      threadId = await createThread()

      // Salvar thread ID na conversa
      await supabase.from("conversations").update({ openai_thread_id: threadId }).eq("id", conversationId)

      console.log("[v0] Thread criada:", threadId)
    }

    // Salvar mensagem do usuário
    const { data: userMessage } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      })
      .select()
      .single()

    // Adicionar mensagem à thread
    await addMessageToThread(threadId, message)

    // Executar assistente
    const runId = await runAssistant(threadId, agent.openai_assistant_id)
    console.log("[v0] Run iniciado:", runId)

    // Aguardar conclusão (polling)
    let run = await getRunStatus(threadId, runId)
    let attempts = 0
    const maxAttempts = 30 // 30 segundos timeout

    while (run.status === "in_progress" || run.status === "queued") {
      if (attempts >= maxAttempts) {
        throw new Error("Timeout ao aguardar resposta do assistente")
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
      run = await getRunStatus(threadId, runId)
      attempts++
    }

    if (run.status !== "completed") {
      throw new Error(`Assistente retornou status: ${run.status}`)
    }

    // Buscar resposta
    const messages = await getThreadMessages(threadId)
    const assistantMessage = messages.find((m: any) => m.role === "assistant" && m.run_id === runId)

    if (!assistantMessage) {
      throw new Error("Nenhuma resposta do assistente encontrada")
    }

    const responseContent = assistantMessage.content[0]?.text?.value || ""

    // Salvar resposta do assistente
    const { data: botMessage } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: responseContent,
      })
      .select()
      .single()

    console.log("[v0] Resposta do assistente salva")

    return NextResponse.json({
      success: true,
      userMessage,
      botMessage,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao processar mensagem:", error)
    return NextResponse.json({ error: error.message || "Erro ao processar mensagem" }, { status: 500 })
  }
}
