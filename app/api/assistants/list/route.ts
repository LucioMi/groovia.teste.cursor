import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getMockAssistants() {
  return [
    {
      id: "asst_mock_1",
      name: "Assistente de Análise de Dados",
      description: "Especialista em análise de dados e visualizações",
      model: "gpt-4-turbo-preview",
      instructions:
        "Você é um assistente especializado em análise de dados. Ajude os usuários a entender seus dados através de análises claras e visualizações eficazes.",
      tools: [{ type: "code_interpreter" }],
      tool_resources: {},
      created_at: Date.now() / 1000,
    },
    {
      id: "asst_mock_2",
      name: "Assistente de Marketing",
      description: "Especialista em estratégias de marketing digital",
      model: "gpt-4-turbo-preview",
      instructions:
        "Você é um assistente de marketing digital. Ajude a criar campanhas eficazes, analisar métricas e otimizar estratégias de conteúdo.",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: ["vs_mock_1"],
        },
      },
      created_at: Date.now() / 1000,
    },
    {
      id: "asst_mock_3",
      name: "Assistente de Suporte ao Cliente",
      description: "Especialista em atendimento e suporte",
      model: "gpt-4-turbo-preview",
      instructions:
        "Você é um assistente de suporte ao cliente. Forneça respostas úteis, empáticas e eficientes para resolver problemas dos clientes.",
      tools: [],
      tool_resources: {},
      created_at: Date.now() / 1000,
    },
  ]
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    console.log("[v0] Fetching assistants from OpenAI API...")
    console.log("[v0] API Key configured:", !!apiKey)

    if (!apiKey) {
      console.log("[v0] No API key found, returning mock data")
      return NextResponse.json({
        assistants: getMockAssistants(),
        isPreview: true,
        message: "Usando dados de exemplo. Configure OPENAI_API_KEY para usar assistentes reais.",
      })
    }

    try {
      const { searchParams } = new URL(request.url)
      const limit = Number.parseInt(searchParams.get("limit") || "20")

      console.log("[v0] Calling OpenAI API directly with fetch...")

      // Buscar lista de assistentes
      const assistantsResponse = await fetch(`https://api.openai.com/v1/assistants?limit=${limit}&order=desc`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (!assistantsResponse.ok) {
        const errorData = await assistantsResponse.json().catch(() => ({}))
        console.error("[v0] OpenAI API error:", assistantsResponse.status, errorData)
        throw new Error(`OpenAI API error: ${assistantsResponse.status}`)
      }

      const assistantsData = await assistantsResponse.json()
      console.log("[v0] Assistants fetched successfully:", assistantsData.data?.length || 0)

      // Processar assistentes e buscar vector stores se necessário
      const assistantsWithVectorStores = await Promise.all(
        (assistantsData.data || []).map(async (assistant: any) => {
          try {
            const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || []
            let vectorStores: any[] = []

            if (vectorStoreIds.length > 0) {
              const vectorStorePromises = vectorStoreIds.map(async (vsId: string) => {
                try {
                  // Buscar informações do vector store
                  const vsResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vsId}`, {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": "application/json",
                      "OpenAI-Beta": "assistants=v2",
                    },
                  })

                  if (!vsResponse.ok) {
                    console.error(`[v0] Error fetching vector store ${vsId}:`, vsResponse.status)
                    return null
                  }

                  const vs = await vsResponse.json()

                  // Buscar arquivos do vector store
                  const filesResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vsId}/files`, {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": "application/json",
                      "OpenAI-Beta": "assistants=v2",
                    },
                  })

                  const filesData = filesResponse.ok ? await filesResponse.json() : { data: [] }

                  return {
                    id: vs.id,
                    name: vs.name,
                    file_counts: vs.file_counts,
                    files: (filesData.data || []).map((f: any) => ({
                      id: f.id,
                      created_at: f.created_at,
                    })),
                  }
                } catch (error) {
                  console.error(`[v0] Error fetching vector store ${vsId}:`, error)
                  return null
                }
              })

              const results = await Promise.all(vectorStorePromises)
              vectorStores = results.filter((vs) => vs !== null)
            }

            return {
              id: assistant.id,
              name: assistant.name || "Sem nome",
              description: assistant.description || "",
              model: assistant.model,
              instructions: assistant.instructions || "",
              tools: assistant.tools || [],
              tool_resources: assistant.tool_resources || {},
              vector_stores: vectorStores,
              created_at: assistant.created_at,
            }
          } catch (error) {
            console.error(`[v0] Error processing assistant ${assistant.id}:`, error)
            return {
              id: assistant.id,
              name: assistant.name || "Sem nome",
              description: assistant.description || "",
              model: assistant.model,
              instructions: assistant.instructions || "",
              tools: assistant.tools || [],
              tool_resources: assistant.tool_resources || {},
              vector_stores: [],
              created_at: assistant.created_at,
            }
          }
        }),
      )

      console.log("[v0] Returning real assistants from OpenAI")
      return NextResponse.json({
        assistants: assistantsWithVectorStores,
        isPreview: false,
      })
    } catch (openaiError: any) {
      const errorMessage = openaiError.message || "Erro desconhecido"
      console.error("[v0] OpenAI API error:", errorMessage)
      console.error("[v0] Full error:", openaiError)

      return NextResponse.json({
        assistants: getMockAssistants(),
        isPreview: true,
        message: `Erro ao conectar com OpenAI (${errorMessage}). Usando dados de exemplo.`,
      })
    }
  } catch (error: any) {
    const errorMessage = error.message || "Erro inesperado ao listar assistentes"
    console.error("[v0] Unexpected error:", errorMessage)

    return NextResponse.json({
      assistants: getMockAssistants(),
      isPreview: true,
      message: "Erro inesperado. Usando dados de exemplo.",
    })
  }
}
