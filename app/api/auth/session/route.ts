import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("user_session")?.value

    if (!sessionToken) {
      return NextResponse.json({ session: null }, { status: 401 })
    }

    const sessions = await sql`
      SELECT s.*, u.id as user_id, u.email, u.name, u.email_verified
      FROM sessions s
      INNER JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
      AND s.expires_at > NOW()
      AND u.deleted_at IS NULL
      LIMIT 1
    `

    if (sessions.length === 0) {
      // Sessão inválida ou expirada
      cookieStore.delete("user_session")
      return NextResponse.json({ session: null }, { status: 401 })
    }

    const session = sessions[0]

    const organizations = await sql`
      SELECT o.id, o.name, o.slug, om.role
      FROM organizations o
      INNER JOIN organization_memberships om ON o.id = om.organization_id
      WHERE om.user_id = ${session.user_id}
      ORDER BY o.created_at DESC
    `

    const preferences = await sql`
      SELECT selected_organization_id FROM user_preferences WHERE user_id = ${session.user_id}
    `

    const selectedOrgId = preferences.length > 0 ? preferences[0].selected_organization_id : organizations[0]?.id

    return NextResponse.json({
      session: {
        user: {
          id: session.user_id,
          email: session.email,
          name: session.name,
          emailVerified: session.email_verified,
        },
        organizations,
        selectedOrganization: selectedOrgId,
      },
    })
  } catch (error) {
    logger.error("Session check error", error as Error)
    return NextResponse.json({ session: null }, { status: 500 })
  }
}
