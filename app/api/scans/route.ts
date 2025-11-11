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

    // Get all active agents from "Jornada Scan" category
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${membership.organization_id}`)
      .eq("status", "active")
      .eq("category", "Jornada Scan")
      .order("created_at")

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }

    // Helper function to find agent by name
    const findAgentByName = (name: string) => {
      return agents.find((a) => a.name === name)
    }

    // Validate that all required agents exist
    const requiredAgents = [
      "SCAN",
      "Mercado ICP",
      "Persona",
      "Sintetizador",
      "GROOVIA INTELLIGENCE",
    ]

    const missingAgents = requiredAgents.filter((name) => !findAgentByName(name))
    if (missingAgents.length > 0) {
      console.error("[v0] Missing required agents:", missingAgents)
      return NextResponse.json(
        { error: "Missing required agents", missingAgents },
        { status: 400 }
      )
    }

    // Get the SCAN agent (first agent in the journey)
    const scanAgent = findAgentByName("SCAN")
    if (!scanAgent) {
      return NextResponse.json({ error: "SCAN agent not found" }, { status: 400 })
    }

    // Create the scan
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        organization_id: membership.organization_id,
        created_by: user.id,
        title: title || "Novo SCAN",
        status: "in_progress",
        current_agent_id: scanAgent.id,
      })
      .select()
      .single()

    if (scanError || !scan) {
      console.error("[v0] Error creating scan:", scanError)
      return NextResponse.json({ error: "Failed to create scan" }, { status: 500 })
    }

    // Create scan steps explicitly for all 6 steps
    // Etapa 1: SCAN (conversacional)
    // Etapa 2: SCAN Clarity (documento manual)
    // Etapa 3: Mercado ICP (autônomo)
    // Etapa 4: Persona (autônomo)
    // Etapa 5: Sintetizador (conversacional ou autônomo)
    // Etapa 6: GROOVIA INTELLIGENCE (autônomo)

    const mercadoIcpAgent = findAgentByName("Mercado ICP")
    const personaAgent = findAgentByName("Persona")
    const sintetizadorAgent = findAgentByName("Sintetizador")
    const intelligenceAgent = findAgentByName("GROOVIA INTELLIGENCE")

    if (!mercadoIcpAgent || !personaAgent || !sintetizadorAgent || !intelligenceAgent) {
      console.error("[v0] Missing agents:", { mercadoIcpAgent, personaAgent, sintetizadorAgent, intelligenceAgent })
      return NextResponse.json({ error: "Required agents not found" }, { status: 500 })
    }

    // Create all 6 steps explicitly
    const scanSteps = [
      // Etapa 1: SCAN (conversacional)
      {
        scan_id: scan.id,
        agent_id: scanAgent.id,
        step_order: 1,
        step_type: "agent" as const,
        status: "in_progress" as const,
        depends_on_step_ids: [],
        auto_execute: false,
      },
      // Etapa 2: SCAN Clarity (documento manual)
      {
        scan_id: scan.id,
        agent_id: null,
        step_order: 2,
        step_type: "document" as const,
        status: "pending" as const,
        depends_on_step_ids: [], // Will be updated after creation
        document_template_url: null,
        manual_document_uploaded: false,
        auto_execute: false,
      },
      // Etapa 3: Mercado ICP (autônomo)
      {
        scan_id: scan.id,
        agent_id: mercadoIcpAgent.id,
        step_order: 3,
        step_type: "autonomous" as const,
        status: "pending" as const,
        depends_on_step_ids: [], // Will be updated after creation
        auto_execute: true,
      },
      // Etapa 4: Persona (autônomo)
      {
        scan_id: scan.id,
        agent_id: personaAgent.id,
        step_order: 4,
        step_type: "autonomous" as const,
        status: "pending" as const,
        depends_on_step_ids: [], // Will be updated after creation
        auto_execute: true,
      },
      // Etapa 5: Sintetizador (determinar tipo baseado em is_passive)
      {
        scan_id: scan.id,
        agent_id: sintetizadorAgent.id,
        step_order: 5,
        step_type: (sintetizadorAgent.is_passive ? "autonomous" : "agent") as const,
        status: "pending" as const,
        depends_on_step_ids: [], // Will be updated after creation
        auto_execute: sintetizadorAgent.is_passive || false,
      },
      // Etapa 6: GROOVIA INTELLIGENCE (autônomo)
      {
        scan_id: scan.id,
        agent_id: intelligenceAgent.id,
        step_order: 6,
        step_type: "autonomous" as const,
        status: "pending" as const,
        depends_on_step_ids: [], // Will be updated after creation
        auto_execute: true,
      },
    ]

    // Insert all scan steps
    const { data: createdSteps, error: stepsError } = await supabase
      .from("scan_steps")
      .insert(scanSteps)
      .select()

    if (stepsError) {
      console.error("[v0] Error creating scan steps:", stepsError)
      return NextResponse.json({ error: "Failed to create scan steps", details: stepsError.message }, { status: 500 })
    }

    if (!createdSteps || createdSteps.length !== 6) {
      console.error("[v0] Expected 6 steps but got:", createdSteps?.length)
      return NextResponse.json({ error: "Failed to create all scan steps" }, { status: 500 })
    }

    // Sort steps by step_order to ensure correct order
    const sortedSteps = createdSteps.sort((a, b) => a.step_order - b.step_order)

    // Update depends_on_step_ids with the actual step IDs
    // Etapa 1 (SCAN): no dependencies
    // Etapa 2 (SCAN Clarity): depends on Etapa 1
    // Etapa 3 (Mercado ICP): depends on Etapa 1
    // Etapa 4 (Persona): depends on Etapas 1, 2, 3
    // Etapa 5 (Sintetizador): depends on Etapa 2
    // Etapa 6 (GROOVIA INTELLIGENCE): depends on all previous steps (1, 2, 3, 4, 5)

    const step1Id = sortedSteps[0]?.id // SCAN
    const step2Id = sortedSteps[1]?.id // SCAN Clarity
    const step3Id = sortedSteps[2]?.id // Mercado ICP
    const step4Id = sortedSteps[3]?.id // Persona
    const step5Id = sortedSteps[4]?.id // Sintetizador
    const step6Id = sortedSteps[5]?.id // GROOVIA INTELLIGENCE

    // Update dependencies for each step
    const updatePromises: Promise<any>[] = []

    // Etapa 2: SCAN Clarity depende da Etapa 1
    if (step2Id && step1Id) {
      updatePromises.push(
        supabase
          .from("scan_steps")
          .update({ depends_on_step_ids: [step1Id] })
          .eq("id", step2Id)
      )
    }

    // Etapa 3: Mercado ICP depende da Etapa 1
    if (step3Id && step1Id) {
      updatePromises.push(
        supabase
          .from("scan_steps")
          .update({ depends_on_step_ids: [step1Id] })
          .eq("id", step3Id)
      )
    }

    // Etapa 4: Persona depende das Etapas 1, 2 e 3
    if (step4Id && step1Id && step2Id && step3Id) {
      updatePromises.push(
        supabase
          .from("scan_steps")
          .update({ depends_on_step_ids: [step1Id, step2Id, step3Id] })
          .eq("id", step4Id)
      )
    }

    // Etapa 5: Sintetizador depende da Etapa 2
    if (step5Id && step2Id) {
      updatePromises.push(
        supabase
          .from("scan_steps")
          .update({ depends_on_step_ids: [step2Id] })
          .eq("id", step5Id)
      )
    }

    // Etapa 6: GROOVIA INTELLIGENCE depende de todas as etapas anteriores
    if (step6Id && step1Id && step2Id && step3Id && step4Id && step5Id) {
      updatePromises.push(
        supabase
          .from("scan_steps")
          .update({ depends_on_step_ids: [step1Id, step2Id, step3Id, step4Id, step5Id] })
          .eq("id", step6Id)
      )
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      const updateResults = await Promise.all(updatePromises)
      const updateErrors = updateResults.filter((result) => result?.error)
      if (updateErrors.length > 0) {
        console.error("[v0] Error updating step dependencies:", updateErrors)
        // Don't fail the request, but log the error
      } else {
        console.log("[v0] Successfully updated all step dependencies")
      }
    }

    console.log("[v0] Created scan with 6 steps:", {
      scanId: scan.id,
      stepsCreated: sortedSteps.length,
      stepOrders: sortedSteps.map((s) => s.step_order),
    })

    return NextResponse.json({ scan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
