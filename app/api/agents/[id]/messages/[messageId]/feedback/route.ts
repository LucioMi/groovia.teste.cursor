import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const { id: agentId, messageId } = await params
    const body = await req.json()
    const { feedbackType, conversationId, question, response } = body

    console.log("[v0] Saving feedback:", { messageId, feedbackType })

    const messageExists = await sql`
      SELECT id FROM messages WHERE id = ${messageId}
    `

    if (!messageExists || messageExists.length === 0) {
      console.log("[v0] Message not found in database, creating placeholder")
      // Create a placeholder message entry if it doesn't exist
      try {
        await sql`
          INSERT INTO messages (id, conversation_id, role, content)
          VALUES (${messageId}, ${conversationId}, 'assistant', ${response || ""})
          ON CONFLICT (id) DO NOTHING
        `
      } catch (error) {
        console.error("[v0] Error creating placeholder message:", error)
      }
    }

    // Save feedback
    await sql`
      INSERT INTO message_feedback (message_id, conversation_id, feedback_type, user_id)
      VALUES (${messageId}, ${conversationId}, ${feedbackType}, 'default-user')
      ON CONFLICT (message_id, user_id) DO UPDATE
      SET feedback_type = ${feedbackType}, created_at = NOW()
    `

    // If approved, save to approved_responses
    if (feedbackType === "approved") {
      // Get current count to set order_index
      const countResult = await sql`
        SELECT COUNT(*) as count FROM approved_responses
        WHERE conversation_id = ${conversationId}
      `
      const count = Array.isArray(countResult) ? countResult[0]?.count || 0 : 0

      await sql`
        INSERT INTO approved_responses (conversation_id, agent_id, user_id, question, response, order_index)
        VALUES (${conversationId}, ${agentId}, 'default-user', ${question}, ${response}, ${Number(count)})
      `

      console.log("[v0] Response approved and saved")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving feedback:", error)
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  try {
    const { messageId } = await params

    const result = await sql`
      SELECT * FROM message_feedback
      WHERE message_id = ${messageId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    const feedback = Array.isArray(result) && result.length > 0 ? result[0] : null

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}
