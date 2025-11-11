import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getServerSession } from "@/lib/auth-server"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session || !session.organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscriptions = await sql`
      SELECT 
        os.*,
        sp.name as plan_name
      FROM organization_subscriptions os
      LEFT JOIN subscription_plans sp ON os.plan_id = sp.id
      WHERE os.organization_id = ${session.organization.id}
      LIMIT 1
    `

    const organizations = await sql`
      SELECT plan_type, plan_status, trial_ends_at
      FROM organizations
      WHERE id = ${session.organization.id}
    `

    const subscription = subscriptions[0] || organizations[0]

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("[v0] Error fetching subscription:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}
