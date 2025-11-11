import { NextResponse } from "next/server"
import { getCurrentOrganizationId } from "@/lib/feature-gates"
import { getOrganizationMembers, inviteUserToOrganization } from "@/lib/organizations"
import { stackServerApp } from "@/lib/stack"

export async function GET() {
  try {
    const orgId = await getCurrentOrganizationId()
    const members = await getOrganizationMembers(orgId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error("[v0] Error fetching members:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orgId = await getCurrentOrganizationId()
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    const token = await inviteUserToOrganization(orgId, email, role, user.id)

    return NextResponse.json({ success: true, token })
  } catch (error) {
    console.error("[v0] Error inviting member:", error)
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 })
  }
}
