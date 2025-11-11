export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { del } from "@vercel/blob"
import { redirect } from "next/navigation"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document
    const { data: document, error } = await supabase.from("documents").select("*").eq("id", id).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("organization_id", document.organization_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete from Blob storage
    try {
      await del(document.file_url)
    } catch (blobError) {
      console.error("[v0] Error deleting from blob:", blobError)
      // Continue even if blob deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase.from("documents").delete().eq("id", id)

    if (deleteError) {
      console.error("[v0] Error deleting document from DB:", deleteError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    // Redirect back to documents page
    redirect("/dashboard/documentos")
  } catch (error) {
    console.error("[v0] Error deleting document:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
