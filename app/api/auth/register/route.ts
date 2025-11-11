import { type NextRequest, NextResponse } from "next/server"
import { sql, executeTransaction } from "@/lib/db"
import { hashPassword } from "@/lib/security"
import { registerSchema, validateInput } from "@/lib/validation"
import { logger } from "@/lib/logger"
import { sendWelcomeEmail } from "@/lib/email"
import { authRateLimit } from "@/lib/rate-limit"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function POST(request: NextRequest) {
  try {
    await authRateLimit(request)

    const body = await request.json()

    const { name, email, password } = validateInput(registerSchema, body)
    const organizationName = body.organizationName || `${name}'s Organization`

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 400 })
    }

    const result = await executeTransaction(async (db) => {
      const passwordHash = await hashPassword(password)

      // Create user
      const userResult = await db`
        INSERT INTO users (name, email, password, email_verified, created_at, updated_at)
        VALUES (${name}, ${email.toLowerCase()}, ${passwordHash}, false, NOW(), NOW())
        RETURNING id, email, name
      `

      const user = userResult[0]

      // Generate organization slug
      let slug = generateSlug(organizationName)

      // Check if slug exists and make it unique
      const existingSlug = await db`
        SELECT id FROM organizations WHERE slug = ${slug}
      `

      if (existingSlug.length > 0) {
        slug = `${slug}-${Date.now().toString(36)}`
      }

      // Create organization
      const orgResult = await db`
        INSERT INTO organizations (name, slug, owner_id, created_at, updated_at)
        VALUES (${organizationName}, ${slug}, ${user.id}, NOW(), NOW())
        RETURNING id, name, slug
      `

      const organization = orgResult[0]

      // Add user as owner of the organization
      await db`
        INSERT INTO organization_memberships (organization_id, user_id, role, joined_at)
        VALUES (${organization.id}, ${user.id}, 'owner', NOW())
      `

      // Get or create free plan
      let planResult = await db`
        SELECT id FROM plans WHERE name = 'Free' AND is_active = true LIMIT 1
      `

      if (planResult.length === 0) {
        planResult = await db`
          INSERT INTO plans (
            name, 
            description, 
            price, 
            billing_period,
            max_agents,
            max_team_members,
            max_conversations_per_month,
            is_active
          ) VALUES (
            'Free',
            'Plano gratuito para começar',
            0,
            'monthly',
            3,
            5,
            100,
            true
          )
          RETURNING id
        `
      }

      const planId = planResult[0].id

      // Create subscription
      await db`
        INSERT INTO subscriptions (organization_id, plan_id, status)
        VALUES (${organization.id}, ${planId}, 'active')
      `

      // Set as user's selected organization
      await db`
        INSERT INTO user_preferences (user_id, selected_organization_id)
        VALUES (${user.id}, ${organization.id})
      `

      return { user, organization }
    })

    sendWelcomeEmail(result.user.email, result.user.name).catch((err) =>
      logger.error("Failed to send welcome email", err),
    )

    logger.info("User registered successfully", {
      userId: result.user.id,
      email: result.user.email,
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        organization: result.organization,
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error("Registration error", error as Error)

    if (error instanceof Error && error.message.includes("Validação falhou")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Erro ao criar conta. Por favor, tente novamente." }, { status: 500 })
  }
}
