import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching user stats from database...")

    const { count: totalAgents, error: agentsError } = await supabaseAdmin
      .from("agents")
      .select("*", { count: "exact", head: true })

    if (agentsError) throw agentsError

    // Get sessions this month (mock for now)
    const totalSessions = 150

    // Get webhooks count (mock for now)
    const totalWebhooks = 5

    const { count: totalMembers, error: membersError } = await supabaseAdmin
      .from("organization_memberships")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", "org-1")

    if (membersError) throw membersError

    console.log("[v0] User stats:", { totalAgents, totalSessions, totalWebhooks, totalMembers })

    return NextResponse.json({
      totalAgents: totalAgents || 0,
      totalSessions,
      totalWebhooks,
      totalMembers: totalMembers || 0,
      agentsLimit: 10,
      sessionsLimit: 1000,
      webhooksLimit: 20,
    })
  } catch (error) {
    console.error("[v0] Error fetching user stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
