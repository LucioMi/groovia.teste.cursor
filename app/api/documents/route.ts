import { createServerClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { type NextRequest, NextResponse } from "next/server"

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
    const searchParams = request.nextUrl.searchParams
    const agent_id = searchParams.get("agent_id")
    const organization_id = searchParams.get("organization_id")

    let query = supabase.from("documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

    if (agent_id) {
      query = query.eq("agent_id", agent_id)
    }

    if (organization_id) {
      query = query.eq("organization_id", organization_id)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error("[v0] Error fetching documents:", error)
      return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("[v0] Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { name, content, agent_id, organization_id, file_url, file_type, file_size } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: document, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        organization_id: organization_id || null,
        agent_id: agent_id || null,
        name,
        content: content || null,
        file_url: file_url || null,
        file_type: file_type || null,
        file_size: file_size || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating document:", error)
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
