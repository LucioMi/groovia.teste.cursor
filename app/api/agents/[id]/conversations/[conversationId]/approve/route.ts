import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function POST(request: Request, { params }: { params: Promise<{ id: string; conversationId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: agentId, conversationId } = await params
    const { documentName } = await request.json()

    console.log("[v0] Approving conversation and generating document:", conversationId)

    // Get all messages from conversation
    const messages = await sql`
      SELECT * FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `

    // Get agent info
    const agentResult = await sql`
      SELECT * FROM agents WHERE id = ${agentId}
    `
    const agent = agentResult[0]

    // Generate document content
    const documentContent = {
      agentName: agent.name,
      agentDescription: agent.description,
      conversationId,
      timestamp: new Date().toISOString(),
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })),
      summary: messages
        .filter((m: any) => m.role === "assistant")
        .map((m: any) => m.content)
        .join("\n\n"),
    }

    // Convert to JSON string
    const jsonContent = JSON.stringify(documentContent, null, 2)

    // Upload to Vercel Blob
    const blob = await put(
      `documents/${user.id}/${agentId}/${documentName || `conversation-${conversationId}`}.json`,
      jsonContent,
      { access: "public", contentType: "application/json" },
    )

    console.log("[v0] Document uploaded to blob:", blob.url)

    // Save document reference
    const docResult = await sql`
      INSERT INTO documents (agent_id, user_id, name, content, created_at, updated_at)
      VALUES (${agentId}, ${user.id}, ${documentName || `Documento - ${agent.name}`}, ${blob.url}, NOW(), NOW())
      RETURNING *
    `

    const document = docResult[0]

    // Get next agent in workflow
    let nextAgent = null
    if (agent.next_agent_id) {
      const nextAgentResult = await sql`
        SELECT * FROM agents WHERE id = ${agent.next_agent_id}
      `
      nextAgent = nextAgentResult[0]

      // If there's a next agent, attach document to its knowledge base
      if (nextAgent && nextAgent.openai_vector_store_id) {
        console.log("[v0] Attaching document to next agent:", nextAgent.name)

        await sql`
          INSERT INTO knowledge_bases (agent_id, name, file_url, content_text, organization_id, created_at, updated_at, is_active, metadata)
          VALUES (${nextAgent.id}, ${`Context from ${agent.name}`}, ${blob.url}, ${jsonContent}, ${agent.organization_id}, NOW(), NOW(), true, ${JSON.stringify({ sourceAgent: agentId, conversationId })})
        `
      }
    }

    return NextResponse.json({
      document,
      nextAgent,
      blobUrl: blob.url,
    })
  } catch (error: any) {
    console.error("[v0] Error approving conversation:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
