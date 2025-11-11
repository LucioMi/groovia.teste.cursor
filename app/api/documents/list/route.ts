import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const organizationId = searchParams.get("organizationId")

    let query = supabaseAdmin.from("knowledge_bases").select("*").eq("is_active", true)

    if (category) {
      query = query.eq("document_category", category)
    }

    if (organizationId) {
      query = query.eq("organization_id", organizationId)
    }

    const { data: documents, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("[v0] Error listing documents:", error)
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 })
  }
}
