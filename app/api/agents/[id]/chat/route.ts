import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { createThread, addMessageToThread, runAssistant, getRunStatus, getThreadMessages } from "@/lib/openai-assistant"

export const maxDuration = 30
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] ========== CHAT API CALLED ==========")
    console.log("[v0] Agent ID:", agentId)

    let supabaseAuth
    try {
      supabaseAuth = await createServerClient()
    } catch (error) {
      console.error("[v0] ERROR creating Supabase auth client:", error)
      throw error
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] User authenticated:", user.id)

    let supabase
    try {
      supabase = createServiceClient()
      console.log("[v0] Service client created")
    } catch (error) {
      console.error("[v0] ERROR creating service client:", error)
      throw error
    }

    let body
    try {
      body = await req.json()
      console.log("[v0] Request body parsed:", {
        messageCount: body.messages?.length,
        conversationId: body.conversationId,
      })
    } catch (error) {
      console.error("[v0] ERROR parsing request body:", error)
      return Response.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const { messages, conversationId } = body

    if (!messages || !Array.isArray(messages)) {
      console.error("[v0] Invalid messages format:", typeof messages)
      return Response.json({ error: "Messages must be an array" }, { status: 400 })
    }

    const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).maybeSingle()

    if (!agent) {
      console.error("[v0] Agent not found:", agentId)
      return Response.json({ error: "Agent not found" }, { status: 404 })
    }

    // Try to get organization_id from user membership first
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    let organizationId = membership?.organization_id
    console.log("[v0] Organization ID from membership:", organizationId)

    // If no organization from membership, try to get from active scan for this agent
    if (!organizationId) {
      console.log("[v0] No organization from membership, trying active scan for agent:", agentId)
      const { data: activeScan } = await supabase
        .from("scans")
        .select("organization_id")
        .eq("current_agent_id", agentId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeScan?.organization_id) {
        organizationId = activeScan.organization_id
        console.log("[v0] Found organization_id from active scan:", organizationId)
      }
    }

    console.log("[v0] Agent found:", agent.name, "Assistant ID:", agent.openai_assistant_id)

    if (!agent.openai_assistant_id) {
      console.error("[v0] Agent missing OpenAI Assistant ID")
      return Response.json({ error: "Agent not configured with OpenAI Assistant" }, { status: 400 })
    }

    let activeConversationId = conversationId
    let threadId: string | null = null

    if (!activeConversationId) {
      try {
        console.log("[v0] Creating new thread...")
        const thread = await createThread()
        threadId = thread.id
        console.log("[v0] Thread created:", threadId)

        const { data: newConversation, error: convError } = await supabase
          .from("conversations")
          .insert({
            agent_id: agentId,
            user_id: user.id,
            organization_id: organizationId,
            title: `Chat com ${agent.name}`,
            message_count: 0,
            openai_thread_id: threadId,
          })
          .select()
          .single()

        if (convError) {
          console.error("[v0] Error creating conversation:", convError)
          return Response.json({ error: "Failed to create conversation" }, { status: 500 })
        }

        activeConversationId = newConversation.id
        console.log("[v0] Conversation created:", activeConversationId)
      } catch (error) {
        console.error("[v0] ERROR in thread/conversation creation:", error)
        throw error
      }
    } else {
      const { data: existingConversation } = await supabase
        .from("conversations")
        .select("openai_thread_id, organization_id")
        .eq("id", activeConversationId)
        .single()

      threadId = existingConversation?.openai_thread_id

      // If conversation exists but doesn't have organization_id, try to set it
      if (existingConversation && !existingConversation.organization_id && organizationId) {
        console.log("[v0] Updating conversation with organization_id:", organizationId)
        await supabase
          .from("conversations")
          .update({ organization_id: organizationId })
          .eq("id", activeConversationId)
      }

      if (!threadId) {
        const thread = await createThread()
        threadId = thread.id
        await supabase.from("conversations").update({ openai_thread_id: threadId }).eq("id", activeConversationId)
      }
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content) {
      console.error("[v0] Invalid last message:", lastMessage)
      return Response.json({ error: "Invalid message format" }, { status: 400 })
    }

    const messageContent =
      typeof lastMessage.content === "string" ? lastMessage.content : String(lastMessage.content || "")

    console.log("[v0] User message:", messageContent.substring(0, 50))

    let userMessageId: string
    try {
      const { data: userMsg, error: userMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          role: "user",
          content: messageContent,
          agent_id: agentId,
          organization_id: organizationId,
        })
        .select()
        .single()

      if (userMsgError || !userMsg) {
        console.error("[v0] ERROR saving user message:", userMsgError)
        throw userMsgError
      }

      userMessageId = userMsg.id
      console.log("[v0] User message saved to DB with ID:", userMessageId)
    } catch (error) {
      console.error("[v0] ERROR saving user message:", error)
      throw error
    }

    try {
      console.log("[v0] Adding message to thread...")
      await addMessageToThread(threadId!, messageContent, undefined)
      console.log("[v0] Message added to thread")

      console.log("[v0] Running assistant...")
      const run = await runAssistant(threadId!, agent.openai_assistant_id)
      console.log("[v0] Run started:", run.id)

      let runStatus = run
      let pollCount = 0
      while ((runStatus.status === "queued" || runStatus.status === "in_progress") && pollCount < 60) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runStatus = await getRunStatus(threadId!, run.id)
        pollCount++
        console.log("[v0] Run status:", runStatus.status, `(${pollCount}/60)`)
      }

      if (runStatus.status !== "completed") {
        console.error("[v0] Run failed:", runStatus.status, runStatus)
        return Response.json({ error: "Assistant run failed", status: runStatus.status }, { status: 500 })
      }

      console.log("[v0] Getting thread messages...")
      const threadMessages = await getThreadMessages(threadId!)
      const assistantMessage = threadMessages.find((m: any) => m.role === "assistant" && m.run_id === run.id)

      if (!assistantMessage || !assistantMessage.content?.[0]?.text?.value) {
        console.error("[v0] No response from assistant")
        return Response.json({ error: "No response from assistant" }, { status: 500 })
      }

      const assistantResponse = assistantMessage.content[0].text.value
      console.log("[v0] Assistant response received:", assistantResponse.substring(0, 100))

      let assistantMessageId: string
      const { data: assistantMsg, error: assistantMsgError } = await supabase
        .from("messages")
        .insert({
          conversation_id: activeConversationId,
          role: "assistant",
          content: assistantResponse,
          agent_id: agentId,
          organization_id: organizationId,
        })
        .select()
        .single()

      if (assistantMsgError || !assistantMsg) {
        console.error("[v0] ERROR saving assistant message:", assistantMsgError)
        throw assistantMsgError
      }

      assistantMessageId = assistantMsg.id
      console.log("[v0] Assistant message saved to DB with ID:", assistantMessageId)

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          message_count: messages.length + 1,
        })
        .eq("id", activeConversationId)

      console.log("[v0] ========== CHAT COMPLETE ==========")

      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          try {
            const metadata = {
              conversationId: activeConversationId,
              userMessageId,
              assistantMessageId,
            }
            const metadataLine = `2:[${JSON.stringify(metadata)}]\n`
            controller.enqueue(encoder.encode(metadataLine))

            controller.enqueue(encoder.encode(`0:${JSON.stringify(assistantResponse)}\n`))

            controller.enqueue(encoder.encode(`d:{"finishReason":"stop"}\n`))

            controller.close()
          } catch (error) {
            console.error("[v0] Stream error:", error)
            controller.error(error)
          }
        },
      })

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
          "X-Conversation-Id": activeConversationId,
        },
      })
    } catch (openaiError) {
      console.error("[v0] ERROR in OpenAI operations:", openaiError)
      throw openaiError
    }
  } catch (error) {
    console.error("[v0] ========== CRITICAL ERROR ==========")
    console.error("[v0] Error name:", error instanceof Error ? error.name : "Unknown")
    console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack")
    console.error("[v0] ========================================")
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "Unknown",
      },
      { status: 500 },
    )
  }
}
