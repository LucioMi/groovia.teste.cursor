export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] [UPLOAD] Starting file upload for agent:", agentId)

    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error("[v0] [UPLOAD] Authentication failed:", authError)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] [UPLOAD] User authenticated:", user.id)

    const supabaseAdmin = createAdminClient()
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      console.error("[v0] [UPLOAD] Error fetching organization:", membershipError)
      return Response.json({ error: "Failed to fetch organization" }, { status: 500 })
    }

    const organizationId = membership?.organization_id

    if (!organizationId) {
      console.error("[v0] [UPLOAD] No organization found for user:", user.id)
      return Response.json({ error: "No organization found" }, { status: 400 })
    }

    console.log("[v0] [UPLOAD] Organization ID:", organizationId)

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      console.error("[v0] [UPLOAD] No files provided")
      return Response.json({ error: "No files provided" }, { status: 400 })
    }

    console.log("[v0] [UPLOAD] Processing", files.length, "file(s)")

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        console.log("[v0] [UPLOAD] Uploading file:", file.name, "size:", file.size, "type:", file.type)

        const blob = await put(`attachments/${organizationId}/${agentId}/${file.name}`, file, {
          access: "public",
          addRandomSuffix: true,
        })

        console.log("[v0] [UPLOAD] File uploaded:", blob.url)

        return {
          name: file.name,
          url: blob.url,
          size: blob.size,
          type: file.type,
        }
      }),
    )

    console.log("[v0] [UPLOAD] All files uploaded successfully")

    return Response.json({
      success: true,
      files: uploadedFiles,
    })
  } catch (error) {
    console.error("[v0] [UPLOAD] Error uploading files:", error)
    return Response.json({ error: "Failed to upload files" }, { status: 500 })
  }
}
