import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { addMessageToThread, runAssistant, getRunStatus, getThreadMessages, createThread } from "@/lib/openai-assistant"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await params
    console.log("[v0] Fetching messages for conversation:", conversationId)

    const messages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("[v0] Error fetching messages:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: agentId, conversationId } = await params
    const { content, fileIds } = await request.json()

    console.log("[v0] Sending message to agent:", agentId)

    // Get agent details
    const agentResult = await sql`
      SELECT * FROM agents WHERE id = ${agentId}
    `
    const agent = agentResult[0]

    if (!agent || !agent.openai_assistant_id) {
      return NextResponse.json({ error: "Agent not configured with OpenAI" }, { status: 400 })
    }

    // Save user message
    const userMessageResult = await sql`
      INSERT INTO messages (conversation_id, role, content, created_at)
      VALUES (${conversationId}, 'user', ${content}, NOW())
      RETURNING *
    `

    // Get or create thread ID
    let threadId = agent.openai_thread_id
    if (!threadId) {
      const thread = await createThread()
      threadId = thread.id

      // Save thread ID
      await sql`
        UPDATE agents SET openai_thread_id = ${threadId} WHERE id = ${agentId}
      `
    }

    // Add message to OpenAI thread
    await addMessageToThread(threadId, content, fileIds)

    // Run assistant
    const run = await runAssistant(threadId, agent.openai_assistant_id)
    console.log("[v0] Assistant run started:", run.id)

    // Poll for completion
    let runStatus = await getRunStatus(threadId, run.id)
    let attempts = 0
    while (runStatus.status === "in_progress" || runStatus.status === "queued") {
      if (attempts++ > 60) break // 1 minute timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))
      runStatus = await getRunStatus(threadId, run.id)
    }

    if (runStatus.status === "completed") {
      // Get assistant response
      const threadMessages = await getThreadMessages(threadId)
      const assistantMessage = threadMessages.find((m: any) => m.role === "assistant" && m.run_id === run.id)

      if (assistantMessage) {
        const assistantContent = assistantMessage.content[0]?.text?.value || "No response"

        // Save assistant message
        const assistantMessageResult = await sql`
          INSERT INTO messages (conversation_id, role, content, created_at)
          VALUES (${conversationId}, 'assistant', ${assistantContent}, NOW())
          RETURNING *
        `

        // Update conversation
        await sql`
          UPDATE conversations 
          SET updated_at = NOW(), 
              last_message_at = NOW(),
              message_count = message_count + 2
          WHERE id = ${conversationId}
        `

        return NextResponse.json({
          userMessage: userMessageResult[0],
          assistantMessage: assistantMessageResult[0],
        })
      }
    }

    return NextResponse.json({ error: "Assistant did not respond" }, { status: 500 })
  } catch (error: any) {
    console.error("[v0] Error sending message:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
