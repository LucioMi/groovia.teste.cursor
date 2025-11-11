import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { requirePermission } from "@/lib/auth-server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const { id, memberId } = await params
    await requirePermission("users:update")
    const { role } = await request.json()

    if (!role) {
      return NextResponse.json({ error: "Role required" }, { status: 400 })
    }

    await sql`
      UPDATE organization_memberships
      SET role = ${role}
      WHERE id = ${memberId} AND organization_id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating member:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update member" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const { id, memberId } = await params
    await requirePermission("users:delete")

    await sql`
      DELETE FROM organization_memberships
      WHERE id = ${memberId} AND organization_id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error removing member:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove member" },
      { status: 500 },
    )
  }
}
