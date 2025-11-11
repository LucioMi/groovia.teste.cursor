import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(params.id)

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get organization memberships
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_memberships")
      .select(
        `
        role,
        organization_id,
        organizations (
          name,
          slug
        )
      `,
      )
      .eq("user_id", params.id)
      .single()

    if (memberError) {
      return NextResponse.json({
        user: {
          id: user.user.id,
          email: user.user.email,
          name: user.user.user_metadata?.name,
          created_at: user.user.created_at,
          updated_at: user.user.updated_at,
        },
      })
    }

    return NextResponse.json({
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.user_metadata?.name,
        created_at: user.user.created_at,
        updated_at: user.user.updated_at,
        role: memberships.role,
        organization_id: memberships.organization_id,
        organization_name: memberships.organizations?.name,
        organization_slug: memberships.organizations?.slug,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { email, name, role, organizationId } = body

    if (email || name) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        email,
        user_metadata: { name },
      })

      if (updateError) throw updateError
    }

    if (role && organizationId) {
      const { error: roleError } = await supabaseAdmin
        .from("organization_memberships")
        .update({ role })
        .eq("user_id", params.id)
        .eq("organization_id", organizationId)

      if (roleError) throw roleError
    }

    // Fetch updated user
    const { data: user, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(params.id)

    if (fetchError) throw fetchError

    return NextResponse.json({
      user: {
        id: user.user.id,
        email: user.user.email,
        name: user.user.user_metadata?.name,
      },
    })
  } catch (error) {
    console.error("[v0] Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await supabaseAdmin.from("organization_memberships").delete().eq("user_id", params.id)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
