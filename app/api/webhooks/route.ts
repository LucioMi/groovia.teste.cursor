import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { checkCanCreateWebhook, getCurrentOrganizationId, FeatureGateError } from "@/lib/feature-gates"

export async function GET(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId()

    const searchParams = request.nextUrl.searchParams
    const agent_id = searchParams.get("agent_id")

    let webhooks
    if (agent_id) {
      webhooks = await sql`
        SELECT w.* FROM webhooks w
        INNER JOIN agents a ON w.agent_id = a.id
        WHERE a.organization_id = ${orgId}
        AND w.agent_id = ${agent_id}
        ORDER BY w.created_at DESC
      `
    } else {
      webhooks = await sql`
        SELECT w.* FROM webhooks w
        INNER JOIN agents a ON w.agent_id = a.id
        WHERE a.organization_id = ${orgId}
        ORDER BY w.created_at DESC
      `
    }

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("[v0] Error fetching webhooks:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = await getCurrentOrganizationId()
    await checkCanCreateWebhook(orgId)

    const body = await request.json()
    const { agent_id, url, event_type, secret } = body

    if (!agent_id || !url || !event_type) {
      return NextResponse.json({ error: "agent_id, url, and event_type are required" }, { status: 400 })
    }

    const agentCheck = await sql`
      SELECT id FROM agents 
      WHERE id = ${agent_id} AND organization_id = ${orgId}
    `

    if (agentCheck.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const result = await sql`
      INSERT INTO webhooks (agent_id, url, event_type, secret, organization_id)
      VALUES (${agent_id}, ${url}, ${event_type}, ${secret}, ${orgId})
      RETURNING *
    `

    return NextResponse.json({ webhook: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating webhook:", error)

    if (error instanceof FeatureGateError) {
      return NextResponse.json(
        {
          error: error.message,
          feature: error.feature,
          limit: error.limit,
          current: error.current,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
