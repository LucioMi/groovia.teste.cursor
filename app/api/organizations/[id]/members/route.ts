import { type NextRequest, NextResponse } from "next/server"
import {
  getCurrentUser,
  getUserMembership,
  getOrganizationMembers,
  inviteUserToOrganization,
} from "@/lib/organizations"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orgId = params.id
    const membership = await getUserMembership(user.id, orgId)

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const members = await getOrganizationMembers(orgId)
    return NextResponse.json(members)
  } catch (error) {
    console.error("[v0] Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orgId = params.id
    const membership = await getUserMembership(user.id, orgId)

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    const token = await inviteUserToOrganization(orgId, email, role, user.id)

    // In production, send email with invitation link
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    return NextResponse.json({ token, inviteUrl }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error inviting member:", error)
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
  }
}
