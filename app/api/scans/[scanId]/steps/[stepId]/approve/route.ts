import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: Promise<{ scanId: string; stepId: string }> }) {
  try {
    const { scanId, stepId } = await params
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
    const { documentUrl, approvalNotes } = body

    const supabase = createServiceClient()

    // Update current step to approved
    const { data: step, error: stepError } = await supabase
      .from("scan_steps")
      .update({
        status: "approved",
        document_url: documentUrl,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepId)
      .select()
      .single()

    if (stepError || !step) {
      return NextResponse.json({ error: "Failed to approve step" }, { status: 500 })
    }

    // Get next step
    const { data: nextStep } = await supabase
      .from("scan_steps")
      .select("*")
      .eq("scan_id", scanId)
      .eq("step_order", step.step_order + 1)
      .maybeSingle()

    if (nextStep) {
      // Update next step to in_progress
      await supabase
        .from("scan_steps")
        .update({
          status: "in_progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", nextStep.id)

      // Update scan current_agent_id
      await supabase
        .from("scans")
        .update({
          current_agent_id: nextStep.agent_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", scanId)
    } else {
      // No more steps, mark scan as completed
      await supabase
        .from("scans")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", scanId)
    }

    return NextResponse.json({
      step,
      nextStep,
      scanCompleted: !nextStep,
    })
  } catch (error) {
    console.error("[v0] Error approving step:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
