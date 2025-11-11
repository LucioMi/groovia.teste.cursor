import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requirePermission } from "@/lib/auth-server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission("billing:update")

    const updates = await request.json()
    const allowedFields = [
      "name",
      "description",
      "price_in_cents",
      "interval",
      "features",
      "max_agents",
      "max_sessions_per_month",
      "max_webhooks",
      "is_active",
    ]

    const setClauses = []
    const values = []
    let paramIndex = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === "features") {
          setClauses.push(`${key} = $${paramIndex}::jsonb`)
          values.push(JSON.stringify(value))
        } else {
          setClauses.push(`${key} = $${paramIndex}`)
          values.push(value)
        }
        paramIndex++
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    values.push(id)
    const query = `UPDATE subscription_plans SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`

    const result = await sql.unsafe(query, values)

    return NextResponse.json({ plan: result[0] })
  } catch (error) {
    console.error("[v0] Error updating plan:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update plan" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await requirePermission("billing:update")

    // Soft delete by marking as inactive
    await sql`
      UPDATE subscription_plans
      SET is_active = false
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting plan:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete plan" },
      { status: 500 },
    )
  }
}
