import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    // Autenticação
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
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const organizationId = searchParams.get("organizationId")

    // Obter organização do usuário se não fornecida
    let orgId = organizationId
    if (!orgId) {
      const { data: membership } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle()
      orgId = membership?.organization_id
    }

    if (!orgId) {
      return NextResponse.json({ documents: [] })
    }

    // CORREÇÃO: Buscar da tabela documents (não knowledge_bases)
    let query = supabase
      .from("documents")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    // Filtrar por categoria se fornecida (via metadata)
    if (category) {
      query = query.contains("metadata", { category })
    }

    const { data: documents, error } = await query

    if (error) {
      console.error("[v0] Error listing documents:", error)
      return NextResponse.json({ error: "Failed to list documents" }, { status: 500 })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    console.error("[v0] Error listing documents:", error)
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 })
  }
}
