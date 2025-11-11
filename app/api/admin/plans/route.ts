import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requireSuperAdmin } from "@/lib/auth-server"

export async function GET() {
  try {
    await requireSuperAdmin()

    const plans = await sql`
      SELECT * FROM subscription_plans
      ORDER BY price_in_cents ASC
    `

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("[v0] Error fetching plans:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch plans" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()

    const { name, description, price_in_cents, interval, features, max_agents, max_sessions_per_month, max_webhooks } =
      await request.json()

    if (!name || !description || price_in_cents === undefined || !interval) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO subscription_plans (
        id, name, description, price_in_cents, interval, features,
        max_agents, max_sessions_per_month, max_webhooks, is_active, created_at
      )
      VALUES (
        gen_random_uuid(),
        ${name},
        ${description},
        ${price_in_cents},
        ${interval},
        ${JSON.stringify(features)}::jsonb,
        ${max_agents},
        ${max_sessions_per_month},
        ${max_webhooks},
        true,
        NOW()
      )
      RETURNING *
    `

    return NextResponse.json({ plan: result[0] })
  } catch (error) {
    console.error("[v0] Error creating plan:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create plan" },
      { status: 500 },
    )
  }
}
