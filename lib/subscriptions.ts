import "server-only"

import { sql } from "./db"
import { SUBSCRIPTION_PLANS } from "./products"

export interface OrganizationSubscription {
  id: string
  organizationId: string
  planId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete"
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

export async function getOrganizationSubscription(organizationId: string): Promise<OrganizationSubscription | null> {
  const result = await sql`
    SELECT * FROM organization_subscriptions
    WHERE organization_id = ${organizationId}
    LIMIT 1
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    id: row.id,
    organizationId: row.organization_id,
    planId: row.plan_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createOrganizationSubscription(
  organizationId: string,
  planId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
): Promise<OrganizationSubscription> {
  const result = await sql`
    INSERT INTO organization_subscriptions (
      organization_id,
      plan_id,
      stripe_customer_id,
      stripe_subscription_id,
      status
    ) VALUES (
      ${organizationId},
      ${planId},
      ${stripeCustomerId || null},
      ${stripeSubscriptionId || null},
      ${planId === "free" ? "active" : "incomplete"}
    )
    RETURNING *
  `

  const row = result[0]
  return {
    id: row.id,
    organizationId: row.organization_id,
    planId: row.plan_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    trialEnd: row.trial_end,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateOrganizationSubscription(
  organizationId: string,
  updates: {
    planId?: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    status?: string
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
    cancelAtPeriodEnd?: boolean
  },
): Promise<void> {
  const setClauses: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (updates.planId !== undefined) {
    setClauses.push(`plan_id = $${paramIndex++}`)
    values.push(updates.planId)
  }
  if (updates.stripeCustomerId !== undefined) {
    setClauses.push(`stripe_customer_id = $${paramIndex++}`)
    values.push(updates.stripeCustomerId)
  }
  if (updates.stripeSubscriptionId !== undefined) {
    setClauses.push(`stripe_subscription_id = $${paramIndex++}`)
    values.push(updates.stripeSubscriptionId)
  }
  if (updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.currentPeriodStart !== undefined) {
    setClauses.push(`current_period_start = $${paramIndex++}`)
    values.push(updates.currentPeriodStart)
  }
  if (updates.currentPeriodEnd !== undefined) {
    setClauses.push(`current_period_end = $${paramIndex++}`)
    values.push(updates.currentPeriodEnd)
  }
  if (updates.cancelAtPeriodEnd !== undefined) {
    setClauses.push(`cancel_at_period_end = $${paramIndex++}`)
    values.push(updates.cancelAtPeriodEnd)
  }

  setClauses.push(`updated_at = NOW()`)
  values.push(organizationId)

  await sql.unsafe(
    `
    UPDATE organization_subscriptions
    SET ${setClauses.join(", ")}
    WHERE organization_id = $${paramIndex}
  `,
    values,
  )
}

export async function checkUsageLimits(organizationId: string): Promise<{
  canCreateSession: boolean
  canCreateWebhook: boolean
  currentSessions: number
  currentWebhooks: number
  limits: {
    maxSessionsPerMonth: number
    maxWebhooks: number
  }
}> {
  const subscription = await getOrganizationSubscription(organizationId)
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === (subscription?.planId || "free"))

  if (!plan) {
    throw new Error("Invalid subscription plan")
  }

  // Get current usage (apenas sessões e webhooks)
  const [sessionCount, webhookCount] = await Promise.all([
    sql`
      SELECT COUNT(*) as count FROM sessions 
      WHERE agent_id IN (SELECT id FROM agents WHERE organization_id = ${organizationId})
      AND created_at >= date_trunc('month', NOW())
    `,
    sql`SELECT COUNT(*) as count FROM webhooks WHERE organization_id = ${organizationId}`,
  ])

  const currentSessions = Number.parseInt(sessionCount[0].count)
  const currentWebhooks = Number.parseInt(webhookCount[0].count)

  return {
    canCreateSession: plan.maxSessionsPerMonth === -1 || currentSessions < plan.maxSessionsPerMonth,
    canCreateWebhook: plan.maxWebhooks === -1 || currentWebhooks < plan.maxWebhooks,
    currentSessions,
    currentWebhooks,
    limits: {
      maxSessionsPerMonth: plan.maxSessionsPerMonth,
      maxWebhooks: plan.maxWebhooks,
    },
  }
}
