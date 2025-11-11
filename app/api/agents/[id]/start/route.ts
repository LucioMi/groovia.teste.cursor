import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { user_id } = body

    // Create a new session
    const sessionResult = await sql`
      INSERT INTO agent_sessions (agent_id, user_id, status)
      VALUES (${id}, ${user_id || "anonymous"}, 'active')
      RETURNING *
    `

    // Update agent's last_session
    await sql`
      UPDATE agents 
      SET last_session = NOW(), status = 'in_use'
      WHERE id = ${id}
    `

    // Trigger webhooks for agent_started event
    const webhooks = await sql`
      SELECT * FROM webhooks 
      WHERE agent_id = ${id} 
      AND event_type = 'agent_started'
      AND is_active = true
    `

    for (const webhook of webhooks) {
      try {
        await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhook.secret && { "X-Webhook-Secret": webhook.secret }),
          },
          body: JSON.stringify({
            event_type: "agent_started",
            agent_id: id,
            session_id: sessionResult[0].id,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (error) {
        console.error("[v0] Webhook error:", error)
      }
    }

    return NextResponse.json({ session: sessionResult[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error starting agent:", error)
    return NextResponse.json({ error: "Failed to start agent" }, { status: 500 })
  }
}
