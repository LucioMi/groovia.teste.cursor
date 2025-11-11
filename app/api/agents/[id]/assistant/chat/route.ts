import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createThread, addMessageToThread, runAssistant, getRunStatus, getThreadMessages } from "@/lib/openai-assistant"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const { message, conversationId } = await request.json()

    // Get agent with assistant ID
    const agents = await sql`
      SELECT openai_assistant_id, openai_thread_id
      FROM agents
      WHERE id = ${agentId}
    `

    if (agents.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]

    if (!agent.openai_assistant_id) {
      return NextResponse.json({ error: "Agent does not have an OpenAI Assistant configured" }, { status: 400 })
    }

    // Create or get thread
    let threadId = agent.openai_thread_id
    if (!threadId) {
      const thread = await createThread()
      threadId = thread.id

      // Save thread ID
      await sql`
        UPDATE agents
        SET openai_thread_id = ${threadId}
        WHERE id = ${agentId}
      `
    }

    // Add message to thread
    await addMessageToThread(threadId, message)

    // Run assistant
    const run = await runAssistant(threadId, agent.openai_assistant_id)

    // Save run to database
    await sql`
      INSERT INTO assistant_runs (agent_id, conversation_id, thread_id, run_id, status)
      VALUES (${agentId}, ${conversationId || null}, ${threadId}, ${run.id}, ${run.status})
    `

    // Poll for completion
    let runStatus = run
    while (runStatus.status === "queued" || runStatus.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      runStatus = await getRunStatus(threadId, run.id)
    }

    // Update run status
    await sql`
      UPDATE assistant_runs
      SET status = ${runStatus.status},
          completed_at = NOW(),
          error_message = ${runStatus.last_error?.message || null}
      WHERE run_id = ${run.id}
    `

    if (runStatus.status === "completed") {
      // Get messages
      const messages = await getThreadMessages(threadId)
      const lastMessage = messages[0]

      // Save to conversation if provided
      if (conversationId) {
        await sql`
          INSERT INTO messages (conversation_id, role, content)
          VALUES 
            (${conversationId}, 'user', ${message}),
            (${conversationId}, 'assistant', ${lastMessage.content[0].type === "text" ? lastMessage.content[0].text.value : ""})
        `
      }

      return NextResponse.json({
        success: true,
        response: lastMessage.content[0].type === "text" ? lastMessage.content[0].text.value : "",
        runId: run.id,
      })
    } else {
      return NextResponse.json(
        {
          error: `Run failed with status: ${runStatus.status}`,
          details: runStatus.last_error,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error running assistant:", error)
    return NextResponse.json({ error: error.message || "Failed to run assistant" }, { status: 500 })
  }
}
