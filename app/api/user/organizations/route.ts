import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/db"
import crypto from "crypto"

export async function GET() {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] User not authenticated:", authError?.message)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userId = user.id
    console.log("[v0] Fetching organizations for user:", userId)

    // Get user's current organization preference
    const { data: preference } = await supabaseAdmin
      .from("user_preferences")
      .select("selected_organization_id")
      .eq("user_id", userId)
      .single()

    // Get all organizations the user belongs to
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        role,
        organization_id,
        organizations (
          id,
          name,
          slug
        )
      `,
      )
      .eq("user_id", userId)

    if (memberError) {
      console.error("[v0] Error fetching memberships:", memberError)
      return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
    }

    const organizations = (memberships || []).map((m: any) => ({
      id: m.organizations.id,
      name: m.organizations.name,
      slug: m.organizations.slug,
      plan_type: "free", // Default plan type (not stored in DB schema, but needed for frontend compatibility)
      role: m.role,
    }))

    // Determine current organization
    let current = null
    if (preference?.selected_organization_id) {
      current = organizations.find((org: any) => org.id === preference.selected_organization_id)
    }

    // If no preference or org not found, use first organization
    if (!current && organizations.length > 0) {
      current = organizations[0]

      // Save this as the preference
      await supabaseAdmin.from("user_preferences").upsert(
        {
          user_id: userId,
          selected_organization_id: current.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
    }

    // If user has no organizations, create one automatically
    if (organizations.length === 0) {
      console.log("[v0] No organizations found for user, creating one automatically...")
      
      try {
        // Generate organization name from user email
        const emailPrefix = user.email?.split("@")[0] || "usuario"
        const orgName = `${emailPrefix}'s Organization`
        const orgSlug = orgName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

        // Check if slug already exists
        let finalSlug = orgSlug
        let counter = 1
        while (true) {
          const { data: existingOrg } = await supabaseAdmin
            .from("organizations")
            .select("id")
            .eq("slug", finalSlug)
            .maybeSingle()

          if (!existingOrg) break
          finalSlug = `${orgSlug}-${counter}`
          counter++
        }

        // Create organization
        const orgId = crypto.randomUUID()
        const { error: orgError } = await supabaseAdmin.from("organizations").insert({
          id: orgId,
          name: orgName,
          slug: finalSlug,
          owner_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (orgError) {
          console.error("[v0] Error creating organization:", orgError)
          return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
        }

        // Add user as owner
        const { error: membershipError } = await supabaseAdmin.from("organization_memberships").insert({
          id: crypto.randomUUID(),
          organization_id: orgId,
          user_id: userId,
          role: "owner",
          joined_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (membershipError) {
          console.error("[v0] Error creating membership:", membershipError)
          return NextResponse.json({ error: "Failed to create membership" }, { status: 500 })
        }

        // Set as selected organization
        await supabaseAdmin.from("user_preferences").upsert(
          {
            user_id: userId,
            selected_organization_id: orgId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )

        // Fetch the newly created organization
        const { data: newOrg } = await supabaseAdmin
          .from("organizations")
          .select("id, name, slug")
          .eq("id", orgId)
          .single()

        if (newOrg) {
          organizations.push({
            id: newOrg.id,
            name: newOrg.name,
            slug: newOrg.slug,
            plan_type: "free", // Default plan type (not stored in DB, but needed for frontend)
            role: "owner",
          })
          current = organizations[0]
          console.log("[v0] Organization created automatically:", current.name)
        }
      } catch (error) {
        console.error("[v0] Error creating organization automatically:", error)
        return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
      }
    }

    console.log("[v0] Organizations loaded:", { userId, total: organizations.length, current: current?.name })

    return NextResponse.json({ organizations, current })
  } catch (error) {
    console.error("[v0] Error fetching organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}
