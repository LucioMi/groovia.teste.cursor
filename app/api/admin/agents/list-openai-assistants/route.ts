import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Listando assistentes da OpenAI...")

    const supabase = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Erro de autenticação:", authError)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("[v0] Usuário autenticado:", user.id)

    // Verificar se é super_admin
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

    console.log("[v0] Role do usuário:", roleData?.role)

    if (roleData?.role !== "super_admin") {
      console.error("[v0] Usuário não é super_admin")
      return NextResponse.json(
        { error: "Acesso negado. Apenas super_admins podem acessar esta funcionalidade." },
        { status: 403 },
      )
    }

    console.log("[v0] Super admin verificado, listando assistentes...")

    // Buscar assistentes da OpenAI via REST API
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("[v0] OPENAI_API_KEY não configurada")
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 })
    }

    console.log("[v0] Fazendo request para OpenAI API...")

    const response = await fetch("https://api.openai.com/v1/assistants?limit=100", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    console.log("[v0] Response status da OpenAI:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Erro na API da OpenAI:", errorText)
      return NextResponse.json({ error: "Erro ao buscar assistentes da OpenAI: " + errorText }, { status: 500 })
    }

    const data = await response.json()
    console.log("[v0] Encontrados", data.data?.length || 0, "assistentes")

    // Buscar vector stores
    const vectorStoresResponse = await fetch("https://api.openai.com/v1/vector_stores?limit=100", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    let vectorStores: any[] = []
    if (vectorStoresResponse.ok) {
      const vectorStoresData = await vectorStoresResponse.json()
      vectorStores = vectorStoresData.data || []
      console.log("[v0] Encontrados", vectorStores.length, "vector stores")
    }

    // Mapear assistentes com informações dos vector stores
    const assistants = (data.data || []).map((assistant: any) => {
      const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || []
      const linkedVectorStores = vectorStoreIds
        .map((vsId: string) => {
          const vs = vectorStores.find((v: any) => v.id === vsId)
          return vs ? { id: vs.id, name: vs.name, file_count: vs.file_counts?.total || 0 } : null
        })
        .filter(Boolean)

      return {
        id: assistant.id,
        name: assistant.name,
        description: assistant.description || assistant.instructions || "Sem descrição",
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools || [],
        vector_stores: linkedVectorStores,
        created_at: assistant.created_at,
      }
    })

    console.log("[v0] Retornando", assistants.length, "assistentes processados")

    return NextResponse.json({
      assistants,
      total: assistants.length,
    })
  } catch (error) {
    console.error("[v0] Erro ao listar assistentes:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido ao listar assistentes" },
      { status: 500 },
    )
  }
}
