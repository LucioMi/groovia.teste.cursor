import "server-only"
import { sql } from "./db"
import { stackServerApp } from "./stack"
import crypto from "crypto"

export type OrganizationRole = "owner" | "admin" | "member"

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationMembership {
  id: string
  organizationId: string
  userId: string
  role: OrganizationRole
  invitedBy?: string
  invitedAt?: Date
  joinedAt: Date
  createdAt: Date
}

export async function getCurrentUser() {
  try {
    const user = await stackServerApp.getUser()
    return user
  } catch (error) {
    return null
  }
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const result = await sql`
    SELECT o.* 
    FROM organizations o
    INNER JOIN organization_memberships om ON o.id = om.organization_id
    WHERE om.user_id = ${userId}
    ORDER BY o.created_at DESC
  `

  return result.map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const result = await sql`
    SELECT * FROM organizations WHERE id = ${orgId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getUserMembership(userId: string, orgId: string): Promise<OrganizationMembership | null> {
  const result = await sql`
    SELECT * FROM organization_memberships 
    WHERE user_id = ${userId} AND organization_id = ${orgId}
  `

  if (result.length === 0) return null

  const row = result[0]
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
  }
}

export async function hasPermission(userId: string, orgId: string, requiredRole: OrganizationRole): Promise<boolean> {
  const membership = await getUserMembership(userId, orgId)
  if (!membership) return false

  const roleHierarchy: Record<OrganizationRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  }

  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole]
}

export async function createOrganization(data: {
  name: string
  slug: string
  ownerId: string
}): Promise<Organization> {
  // Create organization
  const orgResult = await sql`
    INSERT INTO organizations (name, slug, owner_id)
    VALUES (${data.name}, ${data.slug}, ${data.ownerId})
    RETURNING *
  `
  const row = orgResult[0]

  // Add creator as owner
  await sql`
    INSERT INTO organization_memberships (organization_id, user_id, role, joined_at)
    VALUES (${row.id}, ${data.ownerId}, 'owner', NOW())
  `

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getOrganizationMembers(orgId: string) {
  const result = await sql`
    SELECT om.*
    FROM organization_memberships om
    WHERE om.organization_id = ${orgId}
    ORDER BY om.created_at ASC
  `
  return result
}

export async function inviteUserToOrganization(
  orgId: string,
  email: string,
  role: OrganizationRole,
  invitedBy: string,
): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await sql`
    INSERT INTO organization_invitations (organization_id, email, role, invited_by, token, expires_at)
    VALUES (${orgId}, ${email}, ${role}, ${invitedBy}, ${token}, ${expiresAt})
  `

  return token
}

export async function getSelectedOrganization(userId: string): Promise<string | null> {
  const result = await sql`
    SELECT selected_organization_id FROM user_preferences
    WHERE user_id = ${userId}
  `

  return result.length > 0 ? result[0].selected_organization_id : null
}

export async function setSelectedOrganization(userId: string, orgId: string): Promise<void> {
  await sql`
    INSERT INTO user_preferences (user_id, selected_organization_id)
    VALUES (${userId}, ${orgId})
    ON CONFLICT (user_id) 
    DO UPDATE SET selected_organization_id = ${orgId}, updated_at = NOW()
  `
}
