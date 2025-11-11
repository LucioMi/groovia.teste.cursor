import "server-only"

import { sql } from "./db"

export interface PlatformStats {
  totalOrganizations: number
  totalUsers: number
  totalAgents: number
  totalSessions: number
  activeSubscriptions: number
  monthlyRevenue: number
  growthRate: number
}

export interface SubscriptionBreakdown {
  planId: string
  planName: string
  count: number
  revenue: number
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [orgCount, userCount, agentCount, sessionCount, activeSubCount, revenueData, lastMonthOrgCount] =
    await Promise.all([
      sql`SELECT COUNT(*) as count FROM organizations`,
      sql`SELECT COUNT(DISTINCT user_id) as count FROM organization_memberships`,
      sql`SELECT COUNT(*) as count FROM agents`,
      sql`SELECT COUNT(*) as count FROM agent_sessions WHERE started_at >= date_trunc('month', NOW())`,
      sql`SELECT COUNT(*) as count FROM organization_subscriptions WHERE status = 'active'`,
      sql`
      SELECT COALESCE(SUM(sp.price_in_cents), 0) as revenue
      FROM organization_subscriptions os
      INNER JOIN subscription_plans sp ON os.plan_id = sp.id
      WHERE os.status = 'active'
    `,
      sql`
      SELECT COUNT(*) as count FROM organizations 
      WHERE created_at >= date_trunc('month', NOW() - interval '1 month')
      AND created_at < date_trunc('month', NOW())
    `,
    ])

  const currentOrgs = Number.parseInt(orgCount[0].count)
  const lastMonthOrgs = Number.parseInt(lastMonthOrgCount[0].count)
  const growthRate = lastMonthOrgs > 0 ? ((currentOrgs - lastMonthOrgs) / lastMonthOrgs) * 100 : 0

  return {
    totalOrganizations: currentOrgs,
    totalUsers: Number.parseInt(userCount[0].count),
    totalAgents: Number.parseInt(agentCount[0].count),
    totalSessions: Number.parseInt(sessionCount[0].count),
    activeSubscriptions: Number.parseInt(activeSubCount[0].count),
    monthlyRevenue: Number.parseInt(revenueData[0].revenue) / 100, // Convert cents to dollars
    growthRate,
  }
}

export async function getSubscriptionBreakdown(): Promise<SubscriptionBreakdown[]> {
  const result = await sql`
    SELECT 
      sp.id as plan_id,
      sp.name as plan_name,
      COUNT(os.id) as count,
      COALESCE(SUM(sp.price_in_cents), 0) as revenue
    FROM subscription_plans sp
    LEFT JOIN organization_subscriptions os ON sp.id = os.plan_id AND os.status = 'active'
    GROUP BY sp.id, sp.name
    ORDER BY sp.price_in_cents DESC
  `

  return result.map((row: any) => ({
    planId: row.plan_id,
    planName: row.plan_name,
    count: Number.parseInt(row.count),
    revenue: Number.parseInt(row.revenue) / 100,
  }))
}

export async function getRecentOrganizations(limit = 10) {
  const result = await sql`
    SELECT 
      o.*,
      os.plan_id,
      os.status as subscription_status,
      COUNT(DISTINCT om.user_id) as member_count,
      COUNT(DISTINCT a.id) as agent_count
    FROM organizations o
    LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
    LEFT JOIN organization_memberships om ON o.id = om.organization_id
    LEFT JOIN agents a ON o.id = a.organization_id
    GROUP BY o.id, os.plan_id, os.status
    ORDER BY o.created_at DESC
    LIMIT ${limit}
  `

  return result
}

export async function getUsageMetrics() {
  const result = await sql`
    SELECT 
      DATE_TRUNC('day', started_at) as date,
      COUNT(*) as session_count
    FROM agent_sessions
    WHERE started_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', started_at)
    ORDER BY date ASC
  `

  return result.map((row: any) => ({
    date: row.date,
    sessionCount: Number.parseInt(row.session_count),
  }))
}
