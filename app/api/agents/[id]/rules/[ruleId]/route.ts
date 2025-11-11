import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string; ruleId: string } }) {
  try {
    const { ruleId } = params
    const body = await request.json()
    const { name, description, rule_type, priority, config, is_active } = body

    const result = await sql`
      UPDATE agent_rules
      SET 
        name = ${name},
        description = ${description},
        rule_type = ${rule_type},
        priority = ${priority},
        config = ${JSON.stringify(config)},
        is_active = ${is_active},
        updated_at = NOW()
      WHERE id = ${ruleId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 })
    }

    return NextResponse.json({ rule: result[0] })
  } catch (error) {
    console.error("[v0] Error updating rule:", error)
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; ruleId: string } }) {
  try {
    const { ruleId } = params

    await sql`DELETE FROM agent_rules WHERE id = ${ruleId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting rule:", error)
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 })
  }
}
