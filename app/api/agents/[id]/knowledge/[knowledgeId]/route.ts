import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { del } from "@vercel/blob"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; knowledgeId: string } }) {
  try {
    const { knowledgeId } = params

    const { data: result, error: fetchError } = await supabaseAdmin
      .from("knowledge_bases")
      .select("file_url")
      .eq("id", knowledgeId)
      .single()

    if (fetchError || !result) {
      return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 })
    }

    const fileUrl = result.file_url

    // Delete from Vercel Blob
    await del(fileUrl)

    const { error: deleteError } = await supabaseAdmin.from("knowledge_bases").delete().eq("id", knowledgeId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting knowledge base:", error)
    return NextResponse.json({ error: "Failed to delete knowledge base" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string; knowledgeId: string } }) {
  try {
    const { knowledgeId } = params
    const { is_active } = await request.json()

    const { data: result, error } = await supabaseAdmin
      .from("knowledge_bases")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", knowledgeId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ knowledgeBase: result })
  } catch (error) {
    console.error("[v0] Error updating knowledge base:", error)
    return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 })
  }
}
