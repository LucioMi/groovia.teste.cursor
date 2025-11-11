import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { checkCanCreateSession, getCurrentOrganizationId, FeatureGateError } from "@/lib/feature-gates"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const orgId = await getCurrentOrganizationId()

    const agentCheck = await sql`
      SELECT id FROM agents 
      WHERE id = ${id} AND organization_id = ${orgId}
    `

    if (agentCheck.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const sessions = await sql`
      SELECT * FROM agent_sessions 
      WHERE agent_id = ${id}
      ORDER BY started_at DESC
    `

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("[v0] Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const orgId = await getCurrentOrganizationId()

    const agentCheck = await sql`
      SELECT id FROM agents 
      WHERE id = ${id} AND organization_id = ${orgId}
    `

    if (agentCheck.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    await checkCanCreateSession(orgId)

    const body = await request.json()
    const { user_id, metadata } = body

    const result = await sql`
      INSERT INTO agent_sessions (agent_id, user_id, metadata)
      VALUES (${id}, ${user_id}, ${metadata || {}})
      RETURNING *
    `

    // Update agent's last_session
    await sql`
      UPDATE agents 
      SET last_session = NOW() 
      WHERE id = ${id}
    `

    return NextResponse.json({ session: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating session:", error)

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

    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
