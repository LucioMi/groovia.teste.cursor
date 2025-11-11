"use server"

import { stackServerApp } from "@/lib/stack"
import { createOrganization } from "@/lib/organizations"
import { createOrganizationSubscription } from "@/lib/subscriptions"
import { sql } from "@/lib/db"

export async function createWorkspace(data: {
  organizationName: string
  organizationSlug: string
}) {
  const user = await stackServerApp.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Check if slug is available
  const existing = await sql`
    SELECT id FROM organizations WHERE slug = ${data.organizationSlug}
  `

  if (existing.length > 0) {
    throw new Error("Organization slug already taken")
  }

  // Create organization
  const organization = await createOrganization({
    name: data.organizationName,
    slug: data.organizationSlug,
    ownerId: user.id,
  })

  // Create free subscription
  await createOrganizationSubscription(organization.id, "free")

  // Store user's selected organization in metadata
  await sql`
    INSERT INTO user_preferences (user_id, selected_organization_id)
    VALUES (${user.id}, ${organization.id})
    ON CONFLICT (user_id) 
    DO UPDATE SET selected_organization_id = ${organization.id}
  `

  return organization
}

export async function getUserOnboardingStatus() {
  const user = await stackServerApp.getUser()
  if (!user) {
    return { isOnboarded: false, hasOrganization: false }
  }

  // Check if user has any organizations
  const orgs = await sql`
    SELECT o.id 
    FROM organizations o
    INNER JOIN organization_memberships om ON o.id = om.organization_id
    WHERE om.user_id = ${user.id}
    LIMIT 1
  `

  return {
    isOnboarded: orgs.length > 0,
    hasOrganization: orgs.length > 0,
  }
}
