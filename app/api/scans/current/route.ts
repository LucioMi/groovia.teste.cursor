import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"

// GET current active scan for user's organization
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
      return NextResponse.json({ scan: null })
    }

    // Get current in-progress scan
    const { data: scan, error } = await supabase
      .from("scans")
      .select(
        `
        *,
        scan_steps (
          *,
          agents (
            id,
            name,
            description,
            category
          )
        )
      `,
      )
      .eq("organization_id", membership.organization_id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching current scan:", error)
      return NextResponse.json({ error: "Failed to fetch scan" }, { status: 500 })
    }

    return NextResponse.json({ scan: scan || null })
  } catch (error) {
    console.error("[v0] Error in GET /api/scans/current:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
