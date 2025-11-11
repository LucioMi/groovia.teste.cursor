import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const organizationId = formData.get("organizationId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: "Category required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    const { data: result, error } = await supabaseAdmin
      .from("knowledge_bases")
      .insert({
        name: file.name,
        file_url: blob.url,
        file_type: file.type,
        file_size: file.size,
        metadata: { category, organizationId },
        is_active: true,
        agent_id: "default",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      document: result,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
