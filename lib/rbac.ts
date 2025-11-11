"use client"

// Role-Based Access Control System
export type Role = "admin" | "owner" | "member" | "viewer"

export type Permission =
  | "users:create"
  | "users:read"
  | "users:update"
  | "users:delete"
  | "organizations:create"
  | "organizations:read"
  | "organizations:update"
  | "organizations:delete"
  | "agents:create"
  | "agents:read"
  | "agents:update"
  | "agents:delete"
  | "settings:read"
  | "settings:update"
  | "billing:read"
  | "billing:update"

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "organizations:create",
    "organizations:read",
    "organizations:update",
    "organizations:delete",
    "agents:create",
    "agents:read",
    "agents:update",
    "agents:delete",
    "settings:read",
    "settings:update",
    "billing:read",
    "billing:update",
  ],
  owner: [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "organizations:read",
    "organizations:update",
    "agents:create",
    "agents:read",
    "agents:update",
    "agents:delete",
    "settings:read",
    "settings:update",
    "billing:read",
    "billing:update",
  ],
  member: ["users:read", "organizations:read", "agents:read", "agents:update", "settings:read"],
  viewer: ["users:read", "organizations:read", "agents:read", "settings:read"],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false
}

export function getCurrentUserRole(): Role {
  if (typeof window === "undefined") return "viewer"

  const adminSession = localStorage.getItem("adminSession")
  if (adminSession) return "admin"

  const userRole = localStorage.getItem("userRole")
  return (userRole as Role) || "viewer"
}

export function checkPermission(permission: Permission): boolean {
  const role = getCurrentUserRole()
  return hasPermission(role, permission)
}

export async function getUserRole(userId: string, organizationId: string): Promise<Role> {
  const { sql } = await import("@/lib/db")

  const memberships = await sql`
    SELECT role FROM organization_memberships
    WHERE user_id = ${userId} AND organization_id = ${organizationId}
  `

  if (memberships.length === 0) return "viewer"
  return memberships[0].role as Role
}

export async function checkUserPermission(
  userId: string,
  organizationId: string,
  permission: Permission,
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId)
  return hasPermission(role, permission)
}
