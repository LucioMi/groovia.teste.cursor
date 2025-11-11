import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getUserOrganizations, createOrganization } from "@/lib/organizations"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const organizations = await getUserOrganizations(user.id)
    return NextResponse.json(organizations)
  } catch (error) {
    console.error("[v0] Error fetching organizations:", error)
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, slug } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    const organization = await createOrganization(name, slug, user.id)
    return NextResponse.json(organization, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating organization:", error)
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
  }
}
