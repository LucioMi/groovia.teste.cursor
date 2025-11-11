import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const rules = await sql`
      SELECT * FROM agent_rules 
      WHERE agent_id = ${id}
      ORDER BY priority DESC, created_at DESC
    `

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("[v0] Error fetching agent rules:", error)
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, rule_type, priority, config, is_active } = body

    if (!name || !rule_type || !config) {
      return NextResponse.json({ error: "Name, rule_type, and config are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO agent_rules (agent_id, name, description, rule_type, priority, config, is_active)
      VALUES (${id}, ${name}, ${description}, ${rule_type}, ${priority || 0}, ${JSON.stringify(config)}, ${is_active !== false})
      RETURNING *
    `

    return NextResponse.json({ rule: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating rule:", error)
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 })
  }
}
