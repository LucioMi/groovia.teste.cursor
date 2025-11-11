import { executeQuery, executeTransaction } from "./db"
import { logger } from "./logger"
import { uuidSchema } from "./validation"

// Helper seguro para buscar agente
export async function getAgentById(agentId: string, userId: string) {
  try {
    uuidSchema.parse(agentId)

    return await executeQuery(async (db) => {
      const result = await db`
          SELECT a.* FROM agents a
          INNER JOIN organizations o ON a.organization_id = o.id
          INNER JOIN organization_memberships om ON o.id = om.organization_id
          WHERE a.id = ${agentId}
          AND om.user_id = ${userId}
          LIMIT 1
        `
      return result[0]
    }, userId)
  } catch (error) {
    logger.error("Failed to get agent", error as Error, { agentId, userId })
    throw new Error("Falha ao buscar agente")
  }
}

// Helper seguro para buscar agentes de uma organização
export async function getOrganizationAgents(orgId: string, userId: string) {
  try {
    uuidSchema.parse(orgId)

    return await executeQuery(
      async (db) => {
        return await db`
          SELECT a.* FROM agents a
          INNER JOIN organization_memberships om 
            ON a.organization_id = om.organization_id
          WHERE a.organization_id = ${orgId}
          AND om.user_id = ${userId}
          AND a.status = 'active'
          ORDER BY a.created_at DESC
        `
      },
      userId,
      orgId,
    )
  } catch (error) {
    logger.error("Failed to get organization agents", error as Error, { orgId, userId })
    throw new Error("Falha ao buscar agentes")
  }
}

// Helper seguro para criar agente
export async function createAgent(
  data: {
    name: string
    description: string
    category: string
    organizationId: string
    iconColor?: string
    systemPrompt?: string
  },
  userId: string,
) {
  try {
    return await executeTransaction(
      async (db) => {
        // Verificar se usuário tem permissão
        const membership = await db`
          SELECT role FROM organization_memberships
          WHERE organization_id = ${data.organizationId}
          AND user_id = ${userId}
          LIMIT 1
        `

        if (!membership[0] || !["owner", "admin"].includes(membership[0].role)) {
          throw new Error("Sem permissão para criar agente")
        }

        // Criar agente
        const result = await db`
          INSERT INTO agents (
            name, 
            description, 
            category, 
            organization_id,
            icon_color,
            system_prompt,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${data.name},
            ${data.description},
            ${data.category},
            ${data.organizationId},
            ${data.iconColor || "#8B5CF6"},
            ${data.systemPrompt || "Você é um assistente útil."},
            'active',
            NOW(),
            NOW()
          )
          RETURNING *
        `

        logger.info("Agent created", { agentId: result[0].id, userId })
        return result[0]
      },
      userId,
      data.organizationId,
    )
  } catch (error) {
    logger.error("Failed to create agent", error as Error, { userId })
    throw error
  }
}

// Helper seguro para atualizar agente
export async function updateAgent(
  agentId: string,
  data: Partial<{
    name: string
    description: string
    category: string
    iconColor: string
    systemPrompt: string
    status: string
  }>,
  userId: string,
) {
  try {
    uuidSchema.parse(agentId)

    return await executeTransaction(async (db) => {
      // Verificar permissão
      const agent = await db`
          SELECT a.*, om.role
          FROM agents a
          INNER JOIN organization_memberships om 
            ON a.organization_id = om.organization_id
          WHERE a.id = ${agentId}
          AND om.user_id = ${userId}
          LIMIT 1
        `

      if (!agent[0] || !["owner", "admin"].includes(agent[0].role)) {
        throw new Error("Sem permissão para atualizar agente")
      }

      // Construir query de update
      const updates: string[] = []
      const values: any[] = []

      if (data.name !== undefined) {
        updates.push("name = $" + (values.length + 1))
        values.push(data.name)
      }
      if (data.description !== undefined) {
        updates.push("description = $" + (values.length + 1))
        values.push(data.description)
      }
      if (data.category !== undefined) {
        updates.push("category = $" + (values.length + 1))
        values.push(data.category)
      }
      if (data.iconColor !== undefined) {
        updates.push("icon_color = $" + (values.length + 1))
        values.push(data.iconColor)
      }
      if (data.systemPrompt !== undefined) {
        updates.push("system_prompt = $" + (values.length + 1))
        values.push(data.systemPrompt)
      }
      if (data.status !== undefined) {
        updates.push("status = $" + (values.length + 1))
        values.push(data.status)
      }

      updates.push("updated_at = NOW()")

      const result = await db`
          UPDATE agents 
          SET ${db.unsafe(updates.join(", "))}
          WHERE id = ${agentId}
          RETURNING *
        `

      logger.info("Agent updated", { agentId, userId })
      return result[0]
    }, userId)
  } catch (error) {
    logger.error("Failed to update agent", error as Error, { agentId, userId })
    throw error
  }
}

// Helper seguro para deletar agente
export async function deleteAgent(agentId: string, userId: string) {
  try {
    uuidSchema.parse(agentId)

    return await executeTransaction(async (db) => {
      // Verificar permissão
      const agent = await db`
          SELECT a.*, om.role
          FROM agents a
          INNER JOIN organization_memberships om 
            ON a.organization_id = om.organization_id
          WHERE a.id = ${agentId}
          AND om.user_id = ${userId}
          LIMIT 1
        `

      if (!agent[0] || !["owner", "admin"].includes(agent[0].role)) {
        throw new Error("Sem permissão para deletar agente")
      }

      // Soft delete (mudar status)
      await db`
          UPDATE agents 
          SET status = 'archived', updated_at = NOW()
          WHERE id = ${agentId}
        `

      logger.info("Agent deleted", { agentId, userId })
      return { success: true }
    }, userId)
  } catch (error) {
    logger.error("Failed to delete agent", error as Error, { agentId, userId })
    throw error
  }
}

// Helper para buscar conversas de um agente
export async function getAgentConversations(agentId: string, userId: string) {
  try {
    uuidSchema.parse(agentId)

    return await executeQuery(async (db) => {
      return await db`
          SELECT c.* FROM conversations c
          INNER JOIN agents a ON c.agent_id = a.id
          INNER JOIN organization_memberships om 
            ON a.organization_id = om.organization_id
          WHERE c.agent_id = ${agentId}
          AND c.user_id = ${userId}
          AND om.user_id = ${userId}
          ORDER BY c.updated_at DESC
          LIMIT 50
        `
    }, userId)
  } catch (error) {
    logger.error("Failed to get conversations", error as Error, { agentId, userId })
    throw new Error("Falha ao buscar conversas")
  }
}
