import { unstable_cache } from "next/cache"
import { logger } from "./logger"

interface CacheConfig {
  revalidate?: number // segundos
  tags?: string[]
}

// Cache para organizações
export const getCachedOrganization = (orgId: string) => {
  return unstable_cache(
    async (id: string) => {
      const { sql } = await import("./db")
      const result = await sql`SELECT * FROM organizations WHERE id = ${id}`
      return result[0]
    },
    [`organization-${orgId}`],
    {
      revalidate: 300, // 5 minutos
      tags: [`organization-${orgId}`],
    },
  )(orgId)
}

// Cache para agentes de uma organização
export const getCachedOrganizationAgents = (orgId: string) => {
  return unstable_cache(
    async (id: string) => {
      const { sql } = await import("./db")
      return await sql`
        SELECT * FROM agents 
        WHERE organization_id = ${id} 
        AND status = 'active'
        ORDER BY created_at DESC
      `
    },
    [`org-agents-${orgId}`],
    {
      revalidate: 60, // 1 minuto
      tags: [`org-agents-${orgId}`, "agents"],
    },
  )(orgId)
}

// Cache para planos
export const getCachedPlans = () => {
  return unstable_cache(
    async () => {
      const { sql } = await import("./db")
      return await sql`
        SELECT * FROM plans 
        WHERE is_active = true
        ORDER BY price ASC
      `
    },
    ["plans"],
    {
      revalidate: 3600, // 1 hora
      tags: ["plans"],
    },
  )()
}

// Cache para estatísticas de usuário
export const getCachedUserStats = (userId: string) => {
  return unstable_cache(
    async (id: string) => {
      const { sql } = await import("./db")

      const [agents, conversations, messages] = await Promise.all([
        sql`
          SELECT COUNT(*) as count 
          FROM agents a
          INNER JOIN organizations o ON a.organization_id = o.id
          INNER JOIN organization_memberships om ON o.id = om.organization_id
          WHERE om.user_id = ${id}
        `,
        sql`
          SELECT COUNT(*) as count 
          FROM conversations 
          WHERE user_id = ${id}
        `,
        sql`
          SELECT COUNT(*) as count 
          FROM messages m
          INNER JOIN conversations c ON m.conversation_id = c.id
          WHERE c.user_id = ${id}
        `,
      ])

      return {
        agentCount: Number.parseInt(agents[0]?.count || "0"),
        conversationCount: Number.parseInt(conversations[0]?.count || "0"),
        messageCount: Number.parseInt(messages[0]?.count || "0"),
      }
    },
    [`user-stats-${userId}`],
    {
      revalidate: 300, // 5 minutos
      tags: [`user-stats-${userId}`],
    },
  )(userId)
}

// Helper para invalidar cache
export async function invalidateCache(tags: string[]) {
  try {
    const { revalidateTag } = await import("next/cache")
    for (const tag of tags) {
      revalidateTag(tag)
    }
    logger.info("Cache invalidated", { tags })
  } catch (error) {
    logger.error("Failed to invalidate cache", error as Error, { tags })
  }
}

// Helper para invalidar cache de organização
export async function invalidateOrganizationCache(orgId: string) {
  await invalidateCache([`organization-${orgId}`, `org-agents-${orgId}`])
}

// Helper para invalidar cache de usuário
export async function invalidateUserCache(userId: string) {
  await invalidateCache([`user-stats-${userId}`])
}
