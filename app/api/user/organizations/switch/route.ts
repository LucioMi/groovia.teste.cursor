import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("session")?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { organizationId } = await request.json()

    // Verify user has access to this organization
    const membership = await sql`
      SELECT id
      FROM organization_memberships
      WHERE user_id = ${userId} AND organization_id = ${organizationId}
      LIMIT 1
    `

    if (membership.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update user preference
    await sql`
      INSERT INTO user_preferences (user_id, selected_organization_id, created_at, updated_at)
      VALUES (${userId}, ${organizationId}, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        selected_organization_id = ${organizationId},
        updated_at = NOW()
    `

    console.log("[v0] Organização trocada:", { userId, newOrgId: organizationId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error switching organization:", error)
    return NextResponse.json({ error: "Failed to switch organization" }, { status: 500 })
  }
}
