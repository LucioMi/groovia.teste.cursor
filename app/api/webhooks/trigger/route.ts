import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent_id, event_type, payload } = body

    if (!agent_id || !event_type) {
      return NextResponse.json({ error: "agent_id and event_type are required" }, { status: 400 })
    }

    // Find active webhooks for this agent and event type
    const webhooks = await sql`
      SELECT * FROM webhooks 
      WHERE agent_id = ${agent_id} 
      AND event_type = ${event_type}
      AND is_active = true
    `

    const results = []

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(webhook.secret && { "X-Webhook-Secret": webhook.secret }),
          },
          body: JSON.stringify({
            event_type,
            agent_id,
            payload,
            timestamp: new Date().toISOString(),
          }),
        })

        const responseData = await response.text()

        // Log the webhook call
        await sql`
          INSERT INTO webhook_logs (webhook_id, status_code, request_payload, response_payload)
          VALUES (
            ${webhook.id}, 
            ${response.status}, 
            ${JSON.stringify({ event_type, agent_id, payload })}, 
            ${JSON.stringify({ body: responseData })}
          )
        `

        results.push({
          webhook_id: webhook.id,
          status: response.status,
          success: response.ok,
        })
      } catch (error: any) {
        // Log the error
        await sql`
          INSERT INTO webhook_logs (webhook_id, status_code, request_payload, error_message)
          VALUES (
            ${webhook.id}, 
            ${0}, 
            ${JSON.stringify({ event_type, agent_id, payload })}, 
            ${error.message}
          )
        `

        results.push({
          webhook_id: webhook.id,
          success: false,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      message: "Webhooks triggered",
      results,
      triggered_count: webhooks.length,
    })
  } catch (error) {
    console.error("[v0] Error triggering webhooks:", error)
    return NextResponse.json({ error: "Failed to trigger webhooks" }, { status: 500 })
  }
}
