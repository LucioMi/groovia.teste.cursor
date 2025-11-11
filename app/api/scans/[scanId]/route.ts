import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const { scanId } = await params
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
      .eq("id", scanId)
      .single()

    if (error || !scan) {
      return NextResponse.json({ error: "Scan not found" }, { status: 404 })
    }

    return NextResponse.json({ scan })
  } catch (error) {
    console.error("[v0] Error fetching scan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ scanId: string }> }) {
  try {
    const { scanId } = await params
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
    const supabase = createServiceClient()

    const { data: scan, error } = await supabase
      .from("scans")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", scanId)
      .select()
      .single()

    if (error || !scan) {
      return NextResponse.json({ error: "Failed to update scan" }, { status: 500 })
    }

    return NextResponse.json({ scan })
  } catch (error) {
    console.error("[v0] Error updating scan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
