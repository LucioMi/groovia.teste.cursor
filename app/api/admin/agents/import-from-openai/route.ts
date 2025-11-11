import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Importando assistentes da OpenAI...")

    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Erro de autenticação:", authError)
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    console.log("[v0] Usuário autenticado:", user.id)

    // Verificar se é super_admin
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

    if (roleData?.role !== "super_admin") {
      console.error("[v0] Usuário não é super_admin")
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    console.log("[v0] Super admin verificado, iniciando importação...")

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 })
    }

    let openAIAssistants: any[] = []
    let vectorStores: any[] = []

    try {
      console.log("[v0] Buscando assistentes da OpenAI via REST API...")

      // Buscar assistentes usando fetch
      const assistantsResponse = await fetch("https://api.openai.com/v1/assistants?limit=100&order=desc", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (!assistantsResponse.ok) {
        const errorText = await assistantsResponse.text()
        console.error("[v0] Erro ao buscar assistentes:", errorText)
        return NextResponse.json(
          { error: "Erro ao buscar assistentes da OpenAI", details: errorText },
          { status: assistantsResponse.status },
        )
      }

      const assistantsData = await assistantsResponse.json()
      openAIAssistants = assistantsData.data || []

      console.log("[v0] Buscando vector stores da OpenAI via REST API...")

      // Buscar vector stores usando fetch
      const vectorStoresResponse = await fetch("https://api.openai.com/v1/vector_stores?limit=100", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (vectorStoresResponse.ok) {
        const vectorStoresData = await vectorStoresResponse.json()
        vectorStores = vectorStoresData.data || []
      }

      console.log("[v0] Encontrados", openAIAssistants.length, "assistentes e", vectorStores.length, "vector stores")
    } catch (error: any) {
      console.error("[v0] Erro ao buscar dados da OpenAI:", error)
      return NextResponse.json(
        {
          error: "Erro ao conectar com OpenAI",
          details: error.message,
        },
        { status: 500 },
      )
    }

    const imported = []
    const skipped = []
    const errors = []

    for (const assistant of openAIAssistants) {
      try {
        // Verificar se já existe no banco
        const { data: existing } = await supabase
          .from("agents")
          .select("id")
          .eq("openai_assistant_id", assistant.id)
          .maybeSingle()

        if (existing) {
          skipped.push(assistant.name || assistant.id)
          console.log("[v0] Assistente já existe, pulando:", assistant.name)
          continue
        }

        const vectorStoreId = assistant.tool_resources?.file_search?.vector_store_ids?.[0] || null

        const { data: newAgent, error: insertError } = await supabase
          .from("agents")
          .insert({
            name: assistant.name || "Assistente sem nome",
            description: assistant.description || "Importado da OpenAI",
            openai_assistant_id: assistant.id,
            openai_vector_store_id: vectorStoreId,
            system_prompt: assistant.instructions || "",
            status: "active",
            category: "general",
            // Agentes são globais - criados pelo super_admin e usados por todos
          })
          .select()
          .single()

        if (insertError) {
          console.error("[v0] Erro ao importar assistente:", insertError)
          errors.push({ agent: assistant.name, error: insertError.message })
          continue
        }

        console.log("[v0] Assistente importado com sucesso:", newAgent.name)
        imported.push(newAgent)
      } catch (error: any) {
        console.error("[v0] Erro ao processar assistente:", assistant.name, error)
        errors.push({ agent: assistant.name || assistant.id, error: error.message })
      }
    }

    console.log(
      "[v0] Importação concluída. Importados:",
      imported.length,
      "Ignorados:",
      skipped.length,
      "Erros:",
      errors.length,
    )

    return NextResponse.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      agents: imported,
      errorDetails: errors,
      vectorStores: vectorStores.length,
    })
  } catch (error: any) {
    console.error("[v0] Erro fatal ao importar assistentes:", error)
    return NextResponse.json(
      {
        error: "Erro ao importar assistentes da OpenAI",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
