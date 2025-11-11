import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: organization, error } = await supabaseAdmin
      .from("organizations")
      .select(
        `
        id,
        name,
        slug,
        plan_type,
        plan_status,
        created_at,
        updated_at,
        organization_memberships (count)
      `,
      )
      .eq("id", params.id)
      .single()

    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({
      organization: {
        ...organization,
        member_count: organization.organization_memberships?.[0]?.count || 0,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching organization:", error)
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, slug, plan_type, plan_status } = body

    const { data: organization, error } = await supabaseAdmin
      .from("organizations")
      .update({
        name,
        slug,
        plan_type,
        plan_status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error("[v0] Error updating organization:", error)
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await supabaseAdmin.from("organization_memberships").delete().eq("organization_id", params.id)

    const { data: organization, error } = await supabaseAdmin
      .from("organizations")
      .delete()
      .eq("id", params.id)
      .select()
      .single()

    if (error || !organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting organization:", error)
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
  }
}
