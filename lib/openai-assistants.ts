import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface OpenAIAssistant {
  id: string
  name: string | null
  description: string | null
  model: string
  instructions: string | null
  tools: Array<{ type: string }>
  tool_resources?: {
    file_search?: {
      vector_store_ids?: string[]
    }
    code_interpreter?: {
      file_ids?: string[]
    }
  }
  metadata: Record<string, string>
  created_at: number
}

export interface OpenAIVectorStore {
  id: string
  name: string
  file_counts: {
    in_progress: number
    completed: number
    failed: number
    cancelled: number
    total: number
  }
  created_at: number
}

export async function listOpenAIAssistants(): Promise<OpenAIAssistant[]> {
  try {
    console.log("[v0] Conectando à API da OpenAI...")

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada")
    }

    const assistants = await openai.beta.assistants.list({
      limit: 100,
      order: "desc",
    })

    console.log("[v0] Assistentes encontrados:", assistants.data.length)

    return assistants.data as OpenAIAssistant[]
  } catch (error: any) {
    console.error("[v0] Erro ao buscar assistentes da OpenAI:", error)
    console.error("[v0] Detalhes do erro:", error.message, error.response?.data)
    throw new Error(`Falha ao buscar assistentes: ${error.message}`)
  }
}

export async function listOpenAIVectorStores(): Promise<OpenAIVectorStore[]> {
  try {
    console.log("[v0] Buscando vector stores da OpenAI...")

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não configurada")
    }

    const vectorStores = await openai.beta.vectorStores.list({
      limit: 100,
    })

    console.log("[v0] Vector stores encontrados:", vectorStores.data.length)

    return vectorStores.data as OpenAIVectorStore[]
  } catch (error: any) {
    console.error("[v0] Erro ao buscar vector stores:", error)
    throw new Error(`Falha ao buscar vector stores: ${error.message}`)
  }
}

export async function getVectorStore(vectorStoreId: string): Promise<OpenAIVectorStore> {
  try {
    const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId)
    return vectorStore as OpenAIVectorStore
  } catch (error: any) {
    console.error("[v0] Erro ao buscar vector store:", error)
    throw new Error(`Falha ao buscar vector store: ${error.message}`)
  }
}

export async function getOpenAIAssistant(assistantId: string): Promise<OpenAIAssistant> {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId)
    return assistant as OpenAIAssistant
  } catch (error: any) {
    console.error("[v0] Erro ao buscar assistente da OpenAI:", error)
    throw new Error(`Falha ao buscar assistente: ${error.message}`)
  }
}

export async function createThread(): Promise<string> {
  try {
    const thread = await openai.beta.threads.create()
    return thread.id
  } catch (error: any) {
    console.error("[v0] Erro ao criar thread:", error)
    throw new Error(`Falha ao criar thread: ${error.message}`)
  }
}

export async function addMessageToThread(threadId: string, content: string): Promise<void> {
  try {
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao adicionar mensagem à thread:", error)
    throw new Error(`Falha ao adicionar mensagem à thread: ${error.message}`)
  }
}

export async function runAssistant(threadId: string, assistantId: string): Promise<string> {
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    })

    return run.id
  } catch (error: any) {
    console.error("[v0] Erro ao executar assistente:", error)
    throw new Error(`Falha ao executar assistente: ${error.message}`)
  }
}

export async function getRunStatus(threadId: string, runId: string) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId)
    return run
  } catch (error: any) {
    console.error("[v0] Erro ao verificar status do run:", error)
    throw new Error(`Falha ao verificar status do run: ${error.message}`)
  }
}

export async function getThreadMessages(threadId: string) {
  try {
    const messages = await openai.beta.threads.messages.list(threadId)
    return messages.data
  } catch (error: any) {
    console.error("[v0] Erro ao buscar mensagens da thread:", error)
    throw new Error(`Falha ao buscar mensagens da thread: ${error.message}`)
  }
}

export { openai }
