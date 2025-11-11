import { createServiceClient } from "@/lib/supabase/service"

/**
 * Vercel AI Gateway Integration
 *
 * O Vercel AI Gateway atua como um proxy inteligente entre o aplicativo e a OpenAI,
 * fornecendo cache, controle de taxa, observabilidade e segurança.
 *
 * Arquitetura:
 * App → Vercel AI Gateway → OpenAI API → Response
 *                ↓
 *          Supabase Logs
 *
 * Endpoints suportados:
 * - /v1/assistants (criar, listar, atualizar, deletar)
 * - /v1/threads (criar, gerenciar threads)
 * - /v1/runs (executar assistentes)
 */

// Configuração do Gateway
const GATEWAY_CONFIG = {
  baseUrl: process.env.OPENAI_GATEWAY_URL || "https://api.openai.com/v1",
  apiKey: process.env.GATEWAY_API_KEY || process.env.OPENAI_API_KEY || "dummy-key-for-build",
  enabled: !!process.env.OPENAI_GATEWAY_URL,
}

interface GatewayLogData {
  assistant_id: string
  thread_id?: string
  run_id?: string
  agent_id?: string
  conversation_id?: string
  organization_id?: string
  user_id?: string
  prompt?: string
  request_payload?: any
  response_payload?: any
  response_text?: string
  model?: string
  tokens_used?: number
  latency_ms?: number
  status: "success" | "error" | "timeout"
  error_message?: string
  gateway_endpoint: string
  cache_hit?: boolean
}

async function logToSupabase(logData: GatewayLogData) {
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from("ai_gateway_logs").insert({
      ...logData,
      completed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[AI Gateway] Error logging to Supabase:", error)
    }
  } catch (error) {
    console.error("[AI Gateway] Failed to log:", error)
  }
}

/**
 * Faz uma requisição ao Vercel AI Gateway (ou diretamente à OpenAI se não configurado)
 */
export async function fetchGateway(
  endpoint: string,
  method = "GET",
  body?: any,
  metadata?: {
    agent_id?: string
    conversation_id?: string
    organization_id?: string
    user_id?: string
  },
) {
  const startTime = Date.now()
  const fullUrl = `${GATEWAY_CONFIG.baseUrl}${endpoint}`

  console.log(`[AI Gateway] ${method} ${endpoint}`)
  if (GATEWAY_CONFIG.enabled) {
    console.log("[AI Gateway] Using Vercel AI Gateway")
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        Authorization: `Bearer ${GATEWAY_CONFIG.apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[AI Gateway] Error ${response.status}:`, errorText)

      // Log erro no Supabase
      if (metadata?.agent_id) {
        await logToSupabase({
          assistant_id: body?.assistant_id || "unknown",
          agent_id: metadata.agent_id,
          conversation_id: metadata.conversation_id,
          organization_id: metadata.organization_id,
          user_id: metadata.user_id,
          request_payload: body,
          status: "error",
          error_message: `HTTP ${response.status}: ${errorText}`,
          gateway_endpoint: endpoint,
          latency_ms: latency,
        })
      }

      throw new Error(`AI Gateway error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const cacheHit = response.headers.get("x-vercel-cache") === "HIT"

    // Log sucesso no Supabase
    if (metadata?.agent_id) {
      await logToSupabase({
        assistant_id: data.id || body?.assistant_id || "unknown",
        thread_id: data.thread_id,
        run_id: data.id,
        agent_id: metadata.agent_id,
        conversation_id: metadata.conversation_id,
        organization_id: metadata.organization_id,
        user_id: metadata.user_id,
        prompt: body?.content || body?.instructions,
        request_payload: body,
        response_payload: data,
        model: data.model,
        tokens_used: data.usage?.total_tokens,
        status: "success",
        gateway_endpoint: endpoint,
        latency_ms: latency,
        cache_hit: cacheHit,
      })
    }

    console.log(`[AI Gateway] Success (${latency}ms)${cacheHit ? " [CACHED]" : ""}`)

    return data
  } catch (error) {
    const latency = Date.now() - startTime

    // Log erro no Supabase
    if (metadata?.agent_id) {
      await logToSupabase({
        assistant_id: body?.assistant_id || "unknown",
        agent_id: metadata.agent_id,
        conversation_id: metadata.conversation_id,
        organization_id: metadata.organization_id,
        user_id: metadata.user_id,
        request_payload: body,
        status: "error",
        error_message: error instanceof Error ? error.message : String(error),
        gateway_endpoint: endpoint,
        latency_ms: latency,
      })
    }

    throw error
  }
}

/**
 * Wrapper functions para manter compatibilidade com código existente
 */

export async function listAssistants(limit = 20) {
  return fetchGateway(`/assistants?limit=${limit}&order=desc`)
}

export async function getAssistant(assistantId: string) {
  return fetchGateway(`/assistants/${assistantId}`)
}

export async function createThread() {
  return fetchGateway("/threads", "POST")
}

export async function addMessageToThread(
  threadId: string,
  content: string,
  fileIds?: string[],
  metadata?: {
    agent_id?: string
    conversation_id?: string
    organization_id?: string
    user_id?: string
  },
) {
  return fetchGateway(
    `/threads/${threadId}/messages`,
    "POST",
    {
      role: "user",
      content,
      attachments: fileIds?.map((id) => ({
        file_id: id,
        tools: [{ type: "file_search" as const }],
      })),
    },
    metadata,
  )
}

export async function runAssistant(
  threadId: string,
  assistantId: string,
  metadata?: {
    agent_id?: string
    conversation_id?: string
    organization_id?: string
    user_id?: string
  },
) {
  return fetchGateway(
    `/threads/${threadId}/runs`,
    "POST",
    {
      assistant_id: assistantId,
    },
    metadata,
  )
}

export async function getRunStatus(threadId: string, runId: string) {
  return fetchGateway(`/threads/${threadId}/runs/${runId}`)
}

export async function getThreadMessages(threadId: string) {
  const response = await fetchGateway(`/threads/${threadId}/messages`)
  return response.data
}

export async function createVectorStore(name: string, fileIds: string[]) {
  return fetchGateway("/vector_stores", "POST", {
    name,
    file_ids: fileIds,
  })
}
