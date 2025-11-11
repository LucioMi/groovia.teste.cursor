"use server"

import { stackServerApp } from "@/lib/stack"
import { getUserOrganizations, setSelectedOrganization } from "@/lib/organizations"

export async function switchOrganization(organizationId: string) {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Verify user has access to this organization
  const orgs = await getUserOrganizations(user.id)
  const hasAccess = orgs.some((org) => org.id === organizationId)

  if (!hasAccess) {
    throw new Error("You do not have access to this organization")
  }

  await setSelectedOrganization(user.id, organizationId)

  return { success: true }
}

export async function getUserOrganizationsList() {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  return await getUserOrganizations(user.id)
}
