import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: Request) {
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

    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    const organizationId = membership?.organization_id

    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = (formData.get("category") as string) || "general"
    const description = (formData.get("description") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "for user:", user.id)

    const path = organizationId
      ? `uploads/${organizationId}/${user.id}/${category}/${file.name}`
      : `uploads/${user.id}/${category}/${file.name}`

    const blob = await put(path, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] File uploaded to Blob:", blob.url)

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        name: file.name,
        file_url: blob.url,
        file_type: file.type,
        file_size: file.size,
        content: description,
      })
      .select()
      .single()

    if (docError) {
      console.error("[v0] Error saving document metadata:", docError)
      // Continue even if metadata save fails
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      documentId: document?.id,
    })
  } catch (error) {
    console.error("[v0] Error uploading file:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
