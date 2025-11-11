import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function DELETE(request: NextRequest) {
  try {
    const { id, fileUrl } = await request.json()

    if (!id || !fileUrl) {
      return NextResponse.json({ error: "ID and fileUrl required" }, { status: 400 })
    }

    // Delete from Vercel Blob
    await del(fileUrl)

    const { error } = await supabaseAdmin.from("knowledge_bases").update({ is_active: false }).eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
