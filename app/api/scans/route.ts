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
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
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
          step_type,
          status,
          depends_on_step_ids,
          manual_document_uploaded,
          completed_at
        )
      `,
      )
      .eq("organization_id", membership.organization_id)
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
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get all active agents ordered by next_agent_id to build the flow
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${membership.organization_id}`)
      .eq("status", "active")
      .order("created_at")

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }

    // Create the scan
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        organization_id: membership.organization_id,
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
    // Agora suporta diferentes tipos de etapas
    const scanSteps = []
    let currentAgent = agents.find((a) => !agents.some((other) => other.next_agent_id === a.id)) || agents[0]
    let stepOrder = 1
    const visited = new Set<string>()

    while (currentAgent && !visited.has(currentAgent.id) && stepOrder <= 10) {
      // Determinar tipo de etapa baseado no agente
      const stepType = currentAgent.is_passive ? "autonomous" : "agent"
      
      scanSteps.push({
        scan_id: scan.id,
        agent_id: currentAgent.id,
        step_order: stepOrder,
        step_type: stepType,
        status: stepOrder === 1 ? "in_progress" : "pending",
        depends_on_step_ids: [], // Será atualizado após criar todas as etapas
        auto_execute: currentAgent.is_passive || false,
      })

      visited.add(currentAgent.id)
      currentAgent = agents.find((a) => a.id === currentAgent!.next_agent_id)
      stepOrder++
    }

    if (scanSteps.length > 0) {
      const { data: createdSteps, error: stepsError } = await supabase
        .from("scan_steps")
        .insert(scanSteps)
        .select()

      if (stepsError) {
        console.error("[v0] Error creating scan steps:", stepsError)
        return NextResponse.json({ error: "Failed to create scan steps", details: stepsError.message }, { status: 500 })
      }

      // Atualizar depends_on_step_ids com os IDs reais das etapas anteriores
      if (createdSteps && createdSteps.length > 1) {
        for (let i = 1; i < createdSteps.length; i++) {
          const previousStepId = createdSteps[i - 1].id
          await supabase
            .from("scan_steps")
            .update({
              depends_on_step_ids: [previousStepId],
            })
            .eq("id", createdSteps[i].id)
        }
      }
    }

    return NextResponse.json({ scan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
