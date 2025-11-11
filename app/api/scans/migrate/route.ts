import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// POST - Migrate existing scan to have 6 steps (add SCAN Clarity step)
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

    // Get current scan for the organization
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .select(
        `
        id,
        status,
        scan_steps (
          id,
          step_order,
          agent_id,
          step_type,
          status,
          depends_on_step_ids
        )
      `,
      )
      .eq("organization_id", membership.organization_id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (scanError) {
      console.error("[v0] Error fetching scan:", scanError)
      return NextResponse.json({ error: "Failed to fetch scan" }, { status: 500 })
    }

    if (!scan) {
      return NextResponse.json({ error: "No active scan found" }, { status: 404 })
    }

    const scanSteps = scan.scan_steps || []
    const sortedSteps = [...scanSteps].sort((a: any, b: any) => a.step_order - b.step_order)

    // Check if scan already has 6 steps
    if (sortedSteps.length >= 6) {
      return NextResponse.json({
        success: true,
        message: "Scan already has 6 steps",
        stepsCount: sortedSteps.length,
      })
    }

    // Check if step 2 (SCAN Clarity) already exists
    const hasStep2 = sortedSteps.some((step: any) => step.step_order === 2 && step.step_type === "document")
    if (hasStep2) {
      return NextResponse.json({
        success: true,
        message: "Scan already has SCAN Clarity step",
        stepsCount: sortedSteps.length,
      })
    }

    console.log("[v0] Migrating scan:", scan.id, "from", sortedSteps.length, "to 6 steps")

    // Get all agents from "Jornada Scan" category
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${membership.organization_id}`)
      .eq("status", "active")
      .eq("category", "Jornada Scan")

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }

    // Helper function to find agent by name
    const findAgentByName = (name: string) => {
      return agents.find((a) => a.name === name)
    }

    // Find step 1 (SCAN)
    const step1 = sortedSteps.find((s: any) => s.step_order === 1)
    if (!step1) {
      return NextResponse.json({ error: "Step 1 (SCAN) not found" }, { status: 400 })
    }

    // Step 1 ID for dependencies
    const step1Id = step1.id
    const step1Completed = step1.status === "completed" || step1.status === "approved"

    // If scan has 5 steps, we need to:
    // 1. Insert step 2 (SCAN Clarity) at step_order 2
    // 2. Update step_order of existing steps 2-5 to become 3-6
    // 3. Update dependencies

    // First, update step_order of existing steps (2-5 become 3-6)
    // Use a transaction-like approach: update all step_orders first
    const stepsToUpdate = sortedSteps.filter((s: any) => s.step_order >= 2)
    
    // Store original step_orders for rollback
    const originalStepOrders = stepsToUpdate.map((step: any) => ({
      id: step.id,
      step_order: step.step_order,
    }))
    
    // Update step_order in reverse order to avoid unique constraint violations
    stepsToUpdate.sort((a: any, b: any) => b.step_order - a.step_order)
    
    for (const step of stepsToUpdate) {
      const newStepOrder = step.step_order + 1
      const { error: updateError } = await supabase
        .from("scan_steps")
        .update({ step_order: newStepOrder })
        .eq("id", step.id)
      
      if (updateError) {
        console.error("[v0] Error updating step_order:", updateError)
        return NextResponse.json({ error: "Failed to update step order" }, { status: 500 })
      }
    }

    // Determine status for step 2 based on step 1 completion
    // If step 1 is completed, step 2 should be available (pending but not blocked)
    // If step 1 is not completed, step 2 should be pending (blocked)
    const step2Status = step1Completed ? "pending" : "pending"

    // Create step 2 (SCAN Clarity - document manual)
    const { data: newStep2, error: step2Error } = await supabase
      .from("scan_steps")
      .insert({
        scan_id: scan.id,
        agent_id: null,
        step_order: 2,
        step_type: "document",
        status: step2Status,
        depends_on_step_ids: [step1Id],
        document_template_url: null,
        manual_document_uploaded: false,
        auto_execute: false,
      })
      .select()
      .single()

    if (step2Error || !newStep2) {
      console.error("[v0] Error creating step 2:", step2Error)
      // Rollback: revert step_order changes to original values
      for (const originalStep of originalStepOrders) {
        await supabase
          .from("scan_steps")
          .update({ step_order: originalStep.step_order })
          .eq("id", originalStep.id)
      }
      return NextResponse.json({ error: "Failed to create step 2" }, { status: 500 })
    }

    const step2Id = newStep2.id

    // Update dependencies for steps that now have different step_order
    // Step 3 (old step 2) should depend on step 1 (if it was Mercado ICP)
    // Step 4 (old step 3) should depend on steps 1, 2, 3 (if it was Persona)
    // Step 5 (old step 4) should depend on step 2 (if it was Sintetizador)
    // Step 6 (old step 5) should depend on all previous steps (if it was GROOVIA INTELLIGENCE)

    // Get updated steps
    const { data: updatedSteps } = await supabase
      .from("scan_steps")
      .select("*")
      .eq("scan_id", scan.id)
      .order("step_order")

    if (updatedSteps && updatedSteps.length >= 6) {
      const step3 = updatedSteps.find((s: any) => s.step_order === 3)
      const step4 = updatedSteps.find((s: any) => s.step_order === 4)
      const step5 = updatedSteps.find((s: any) => s.step_order === 5)
      const step6 = updatedSteps.find((s: any) => s.step_order === 6)

      // Update dependencies based on agent names
      const updatePromises: Promise<any>[] = []

      // Step 3 (Mercado ICP) should depend on Step 1
      if (step3) {
        const step3Agent = step3.agent_id ? findAgentByName("Mercado ICP") : null
        if (step3Agent && step3.agent_id === step3Agent.id) {
          updatePromises.push(
            supabase
              .from("scan_steps")
              .update({ depends_on_step_ids: [step1Id] })
              .eq("id", step3.id)
          )
        }
      }

      // Step 4 (Persona) should depend on Steps 1, 2, 3
      if (step4) {
        const step4Agent = step4.agent_id ? findAgentByName("Persona") : null
        if (step4Agent && step4.agent_id === step4Agent.id && step1Id && step2Id && step3?.id) {
          updatePromises.push(
            supabase
              .from("scan_steps")
              .update({ depends_on_step_ids: [step1Id, step2Id, step3.id] })
              .eq("id", step4.id)
          )
        }
      }

      // Step 5 (Sintetizador) should depend on Step 2
      if (step5) {
        const step5Agent = step5.agent_id ? findAgentByName("Sintetizador") : null
        if (step5Agent && step5.agent_id === step5Agent.id && step2Id) {
          updatePromises.push(
            supabase
              .from("scan_steps")
              .update({ depends_on_step_ids: [step2Id] })
              .eq("id", step5.id)
          )
        }
      }

      // Step 6 (GROOVIA INTELLIGENCE) should depend on all previous steps
      if (step6) {
        const step6Agent = step6.agent_id ? findAgentByName("GROOVIA INTELLIGENCE") : null
        if (
          step6Agent &&
          step6.agent_id === step6Agent.id &&
          step1Id &&
          step2Id &&
          step3?.id &&
          step4?.id &&
          step5?.id
        ) {
          updatePromises.push(
            supabase
              .from("scan_steps")
              .update({ depends_on_step_ids: [step1Id, step2Id, step3.id, step4.id, step5.id] })
              .eq("id", step6.id)
          )
        }
      }

      // Execute all dependency updates
      if (updatePromises.length > 0) {
        const updateResults = await Promise.all(updatePromises)
        const updateErrors = updateResults.filter((result) => result?.error)
        if (updateErrors.length > 0) {
          console.error("[v0] Error updating dependencies:", updateErrors)
          // Don't fail, just log the error
        }
      }
    }

    console.log("[v0] Successfully migrated scan to 6 steps")

    return NextResponse.json({
      success: true,
      message: "Scan migrated to 6 steps",
      scanId: scan.id,
      stepsCount: updatedSteps?.length || 6,
    })
  } catch (error) {
    console.error("[v0] Error migrating scan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

