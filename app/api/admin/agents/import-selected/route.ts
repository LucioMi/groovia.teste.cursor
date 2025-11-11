import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function POST(request: Request) {
  try {
    const { assistantIds, flowConfig } = await request.json()

    if (!Array.isArray(assistantIds) || assistantIds.length === 0) {
      return NextResponse.json({ error: "Nenhum assistente selecionado" }, { status: 400 })
    }

    console.log("[v0] Importando assistentes selecionados:", assistantIds)
    console.log("[v0] Configuração de fluxo recebida:", JSON.stringify(flowConfig))

    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se é super_admin
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle()

    if (roleData?.role !== "super_admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    console.log("[v0] Super admin verificado, iniciando importação...")

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY não configurada" }, { status: 500 })
    }

    // Buscar assistentes da OpenAI
    const response = await fetch("https://api.openai.com/v1/assistants?limit=100", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao buscar assistentes da OpenAI" }, { status: 500 })
    }

    const data = await response.json()
    const allAssistants = data.data || []

    // Filtrar apenas os assistentes selecionados
    const selectedAssistants = allAssistants.filter((a: any) => assistantIds.includes(a.id))

    let imported = 0
    let skipped = 0
    let errors = 0

    const serviceSupabase = createServiceClient()

    // Mapear IDs OpenAI para IDs do banco após inserção
    const agentIdMap: Record<string, string> = {}

    for (const assistant of selectedAssistants) {
      try {
        // Verificar se já existe
        const { data: existing } = await serviceSupabase
          .from("agents")
          .select("id, name")
          .eq("openai_assistant_id", assistant.id)
          .maybeSingle()

        const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || []
        const firstVectorStoreId = vectorStoreIds.length > 0 ? vectorStoreIds[0] : null

        if (firstVectorStoreId) {
          console.log("[v0] ✅ Vector Store encontrado para", assistant.name, ":", firstVectorStoreId)
        } else {
          console.log("[v0] ⚠️ Nenhum Vector Store encontrado para", assistant.name)
        }

        if (existing) {
          console.log("[v0] Assistente já existe, atualizando:", assistant.name)

          // Atualizar assistente existente
          const { error: updateError } = await serviceSupabase
            .from("agents")
            .update({
              name: assistant.name,
              description: assistant.description || assistant.instructions || "Assistente importado da OpenAI",
              system_prompt: assistant.instructions,
              openai_vector_store_id: firstVectorStoreId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)

          if (updateError) {
            console.error("[v0] Erro ao atualizar assistente:", updateError)
            errors++
          } else {
            agentIdMap[assistant.id] = existing.id
            skipped++
          }
          continue
        }

        // Inserir novo assistente
        const { data: newAgent, error: insertError } = await serviceSupabase
          .from("agents")
          .insert({
            name: assistant.name,
            description: assistant.description || assistant.instructions || "Assistente importado da OpenAI",
            status: "active",
            category: "openai",
            openai_assistant_id: assistant.id,
            openai_vector_store_id: firstVectorStoreId,
            system_prompt: assistant.instructions,
            // Agentes são GLOBAIS - sem organization_id nem user_id
          })
          .select("id")
          .maybeSingle()

        if (insertError) {
          console.error("[v0] Erro ao inserir assistente:", insertError)
          errors++
        } else if (newAgent) {
          console.log("[v0] Assistente importado com sucesso:", assistant.name, "ID:", newAgent.id)
          agentIdMap[assistant.id] = newAgent.id
          imported++
        }
      } catch (error) {
        console.error("[v0] Erro ao processar assistente:", error)
        errors++
      }
    }

    if (flowConfig && typeof flowConfig === "object" && Object.keys(flowConfig).length > 0) {
      console.log("[v0] Configurando fluxo entre agentes...")

      for (const [openaiId, nextOpenaiId] of Object.entries(flowConfig)) {
        if (!nextOpenaiId) continue

        const agentId = agentIdMap[openaiId as string]
        const nextAgentId = agentIdMap[nextOpenaiId as string]

        if (agentId && nextAgentId) {
          const { error: updateError } = await serviceSupabase
            .from("agents")
            .update({ next_agent_id: nextAgentId })
            .eq("id", agentId)

          if (updateError) {
            console.error("[v0] Erro ao configurar fluxo:", updateError)
          } else {
            console.log("[v0] Fluxo configurado:", agentId, "->", nextAgentId)
          }
        } else {
          console.log("[v0] IDs não encontrados para fluxo:", openaiId, "->", nextOpenaiId)
        }
      }
    } else {
      console.log("[v0] Nenhuma configuração de fluxo para aplicar")
    }

    console.log("[v0] Importação concluída. Importados:", imported, "Atualizados:", skipped, "Erros:", errors)

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors,
      message: `${imported} assistente(s) importado(s) e ${skipped} assistente(s) atualizado(s) com sucesso!`,
    })
  } catch (error) {
    console.error("[v0] Erro fatal ao importar assistentes selecionados:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
