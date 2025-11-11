import "server-only"

import { checkUsageLimits } from "./subscriptions"
import { getSelectedOrganization } from "./organizations"
import { stackServerApp } from "./stack"

export class FeatureGateError extends Error {
  constructor(
    message: string,
    public readonly feature: string,
    public readonly limit: number,
    public readonly current: number,
  ) {
    super(message)
    this.name = "FeatureGateError"
  }
}

// export async function checkCanCreateAgent(organizationId: string): Promise<void> {
//   const limits = await checkUsageLimits(organizationId)
//
//   if (!limits.canCreateAgent) {
//     throw new FeatureGateError(
//       `Você atingiu o limite de ${limits.limits.maxAgents} agentes do seu plano. Faça upgrade para criar mais agentes.`,
//       "agents",
//       limits.limits.maxAgents,
//       limits.currentAgents,
//     )
//   }
// }

export async function checkCanCreateSession(organizationId: string): Promise<void> {
  const limits = await checkUsageLimits(organizationId)

  if (!limits.canCreateSession) {
    throw new FeatureGateError(
      `Você atingiu o limite de ${limits.limits.maxSessionsPerMonth} sessões por mês do seu plano. Faça upgrade para continuar.`,
      "sessions",
      limits.limits.maxSessionsPerMonth,
      limits.currentSessions,
    )
  }
}

export async function checkCanCreateWebhook(organizationId: string): Promise<void> {
  const limits = await checkUsageLimits(organizationId)

  if (!limits.canCreateWebhook) {
    throw new FeatureGateError(
      `Você atingiu o limite de ${limits.limits.maxWebhooks} webhooks do seu plano. Faça upgrade para criar mais webhooks.`,
      "webhooks",
      limits.limits.maxWebhooks,
      limits.currentWebhooks,
    )
  }
}

export async function getCurrentUserId(): Promise<string> {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user.id
}

export async function getCurrentOrganizationId(): Promise<string> {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  const orgId = await getSelectedOrganization(user.id)
  if (!orgId) {
    throw new Error("No organization selected")
  }

  return orgId
}

export async function getUsageLimits() {
  const orgId = await getCurrentOrganizationId()
  return await checkUsageLimits(orgId)
}
