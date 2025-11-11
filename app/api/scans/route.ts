import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET - List all scans for user's organization
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user's organization
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!userOrg?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get all scans for the organization
    const { data: scans, error } = await supabase
      .from("scans")
      .select(
        `
        *,
        scan_steps (
          id,
          agent_id,
          step_order,
          status,
          completed_at
        )
      `,
      )
      .eq("organization_id", userOrg.organization_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching scans:", error)
      return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 })
    }

    return NextResponse.json({ scans: scans || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new scan for organization
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    const supabase = createServiceClient()

    // Get user's organization
    const { data: userOrg } = await supabase
      .from("user_organizations")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!userOrg?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get all active agents ordered by next_agent_id to build the flow
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${userOrg.organization_id}`)
      .eq("status", "active")
      .order("created_at")

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }

    // Create the scan
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        organization_id: userOrg.organization_id,
        created_by: user.id,
        title: title || "Novo SCAN",
        status: "in_progress",
        current_agent_id: agents[0].id,
      })
      .select()
      .single()

    if (scanError || !scan) {
      console.error("[v0] Error creating scan:", scanError)
      return NextResponse.json({ error: "Failed to create scan" }, { status: 500 })
    }

    // Create scan steps based on agent flow
    const scanSteps = []
    let currentAgent = agents.find((a) => !agents.some((other) => other.next_agent_id === a.id)) || agents[0]
    let stepOrder = 1
    const visited = new Set<string>()

    while (currentAgent && !visited.has(currentAgent.id)) {
      scanSteps.push({
        scan_id: scan.id,
        agent_id: currentAgent.id,
        step_order: stepOrder,
        status: stepOrder === 1 ? "in_progress" : "pending",
      })

      visited.add(currentAgent.id)
      currentAgent = agents.find((a) => a.id === currentAgent!.next_agent_id)
      stepOrder++
    }

    if (scanSteps.length > 0) {
      const { error: stepsError } = await supabase.from("scan_steps").insert(scanSteps)

      if (stepsError) {
        console.error("[v0] Error creating scan steps:", stepsError)
      }
    }

    return NextResponse.json({ scan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
