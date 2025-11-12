import { createServerClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { cookies } from "next/headers"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const journeyType = searchParams.get("journeyType") || "scan"

    console.log("[v0] Fetching progress for journeyType:", journeyType)

    // Get authenticated user
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.log("[v0] User not authenticated, returning empty progress")
      return Response.json({ completedSteps: [] })
    }

    const supabase = createServiceClient()

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
      console.log("[v0] No organization found, returning empty progress")
      return Response.json({ completedSteps: [] })
    }

    if (journeyType === "scan") {
      // Get current scan for the organization (only in_progress scans)
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .select(
          `
          id,
          status,
          scan_steps (
            id,
            step_order,
            status,
            agent_id,
            step_type,
            depends_on_step_ids,
            input_document_ids,
            output_document_id,
            manual_document_uploaded,
            auto_execute,
            completed_at
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
        return Response.json({ completedSteps: [] })
      }

      if (!scan) {
        console.log("[v0] No active scan found, returning empty progress")
        // Return empty progress and empty scanSteps if no active scan exists
        return Response.json({ 
          completedSteps: [],
          scanSteps: [] // Explicitly return empty scanSteps array
        })
      }

      // Verify scan status is in_progress
      if (scan.status !== "in_progress") {
        console.log("[v0] Scan is not in_progress, status:", scan.status)
        return Response.json({ 
          completedSteps: [],
          scanSteps: [] // Explicitly return empty scanSteps array
        })
      }

      // Get completed steps from scan_steps and return scan_steps for display
      const completedSteps: string[] = []
      const scanSteps = scan.scan_steps || []
      
      if (Array.isArray(scanSteps) && scanSteps.length > 0) {
        // Sort steps by step_order
        scanSteps.sort((a: any, b: any) => a.step_order - b.step_order)
        
        scanSteps.forEach((step: any) => {
          // For document steps, check if manual document was uploaded
          if (step.step_type === "document") {
            if (step.manual_document_uploaded || step.status === "completed" || step.status === "approved") {
              completedSteps.push(`scan-${step.step_order}`)
            }
          } else {
            // For other step types, check status
            if (step.status === "completed" || step.status === "approved") {
              completedSteps.push(`scan-${step.step_order}`)
            }
          }
        })
      }

      console.log("[v0] Completed steps from scan:", completedSteps, "Total steps:", scanSteps.length)
      return Response.json({ 
        completedSteps,
        scanSteps: scanSteps // Return scan_steps so frontend can display all steps including document manual
      })
    }

    // For other journey types, return empty for now
    return Response.json({ completedSteps: [] })
  } catch (error) {
    console.error("[v0] Error fetching progress:", error)
    return Response.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { journeyType, stepId } = body

    console.log("[v0] Marking step complete:", { journeyType, stepId })

    if (!journeyType || !stepId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get authenticated user
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
      return Response.json({ error: "No organization found" }, { status: 404 })
    }

    if (journeyType === "scan") {
      // Extract step order from stepId (format: scan-{step_order})
      const stepOrder = parseInt(stepId.replace("scan-", ""))

      if (isNaN(stepOrder)) {
        return Response.json({ error: "Invalid step ID" }, { status: 400 })
      }

      // Get current scan for the organization
      const { data: scan, error: scanError } = await supabase
        .from("scans")
        .select("id")
        .eq("organization_id", membership.organization_id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (scanError) {
        console.error("[v0] Error fetching scan:", scanError)
        return Response.json({ error: "Failed to fetch scan" }, { status: 500 })
      }

      if (!scan) {
        console.log("[v0] No active scan found, creating new scan")
        // Create a new scan if none exists
        // This will be handled by the scan creation flow, so for now just return success
        return Response.json({ success: true, message: "No active scan found" })
      }

      // Update the scan step status
      const { error: updateError } = await supabase
        .from("scan_steps")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("scan_id", scan.id)
        .eq("step_order", stepOrder)

      if (updateError) {
        console.error("[v0] Error updating scan step:", updateError)
        return Response.json({ error: "Failed to update step" }, { status: 500 })
      }

      console.log("[v0] Step marked as complete:", stepId)
      return Response.json({ success: true })
    }

    // For other journey types, just return success for now
    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving progress:", error)
    return Response.json({ error: "Failed to save progress" }, { status: 500 })
  }
}
