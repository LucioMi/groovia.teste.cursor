import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const behaviors = await sql`
      SELECT * FROM agent_behaviors 
      WHERE agent_id = ${id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ behaviors })
  } catch (error) {
    console.error("[v0] Error fetching behaviors:", error)
    return NextResponse.json({ error: "Failed to fetch behaviors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, behavior_type, parameters, is_active } = body

    if (!name || !behavior_type || !parameters) {
      return NextResponse.json({ error: "Name, behavior_type, and parameters are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO agent_behaviors (agent_id, name, description, behavior_type, parameters, is_active)
      VALUES (${id}, ${name}, ${description}, ${behavior_type}, ${JSON.stringify(parameters)}, ${is_active !== false})
      RETURNING *
    `

    return NextResponse.json({ behavior: result[0] }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating behavior:", error)
    return NextResponse.json({ error: "Failed to create behavior" }, { status: 500 })
  }
}
