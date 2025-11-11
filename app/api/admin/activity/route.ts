import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET() {
  try {
    const { data: recentOrgs } = await supabaseAdmin
      .from("organizations")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(2)

    const { data: recentSubs } = await supabaseAdmin
      .from("organization_subscriptions")
      .select(
        `
        updated_at,
        status,
        organizations (name),
        subscription_plans (name)
      `,
      )
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(2)

    const { data: recentAgents } = await supabaseAdmin
      .from("agents")
      .select("name, created_at")
      .order("created_at", { ascending: false })
      .limit(2)

    const { data: recentPayments } = await supabaseAdmin
      .from("payments")
      .select(
        `
        amount_in_cents,
        created_at,
        organizations (name),
        organization_subscriptions (
          subscription_plans (name)
        )
      `,
      )
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(2)

    const activities = []

    // Add organization activities
    if (recentOrgs) {
      for (const org of recentOrgs) {
        activities.push({
          type: "organization",
          title: "Nova organização criada",
          description: `${org.name} - ${getTimeAgo(org.created_at)}`,
          color: "green",
          timestamp: org.created_at,
        })
      }
    }

    // Add subscription activities
    if (recentSubs) {
      for (const sub of recentSubs) {
        activities.push({
          type: "subscription",
          title: "Upgrade de plano",
          description: `${sub.organizations?.name} - ${sub.subscription_plans?.name} - ${getTimeAgo(sub.updated_at)}`,
          color: "blue",
          timestamp: sub.updated_at,
        })
      }
    }

    // Add agent activities
    if (recentAgents) {
      for (const agent of recentAgents) {
        activities.push({
          type: "agent",
          title: "Novo agente criado",
          description: `${agent.name} - ${getTimeAgo(agent.created_at)}`,
          color: "purple",
          timestamp: agent.created_at,
        })
      }
    }

    // Add payment activities
    if (recentPayments) {
      for (const payment of recentPayments) {
        const planName =
          payment.organization_subscriptions && payment.organization_subscriptions.length > 0
            ? payment.organization_subscriptions[0].subscription_plans?.name
            : "Plan"
        activities.push({
          type: "payment",
          title: "Pagamento recebido",
          description: `$${(payment.amount_in_cents / 100).toFixed(2)} - ${planName} - ${getTimeAgo(payment.created_at)}`,
          color: "orange",
          timestamp: payment.created_at,
        })
      }
    }

    // Sort by timestamp and take top 4
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const topActivities = activities.slice(0, 4)

    return NextResponse.json({ activities: topActivities })
  } catch (error) {
    console.error("[v0] Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}

function getTimeAgo(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `há ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`
  if (diffHours < 24) return `há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`
  return `há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`
}
