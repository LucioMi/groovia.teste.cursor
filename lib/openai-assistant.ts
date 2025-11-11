import type { File } from "formdata-node"
import OpenAI from "openai"

let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build",
      dangerouslyAllowBrowser: false, // Explicitly disable browser usage
    })
  }
  return openaiClient
}

// Helper to check if OpenAI is configured
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "dummy-key-for-build"
}

export interface AssistantConfig {
  name: string
  description: string
  instructions: string
  model?: string
  tools?: Array<{ type: "code_interpreter" | "file_search" | "function" }>
  fileIds?: string[]
}

async function fetchOpenAI(endpoint: string, method = "GET", body?: any) {
  const apiKey = process.env.OPENAI_API_KEY || "dummy-key-for-build"
  const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  return response.json()
}

export async function createAssistant(config: AssistantConfig) {
  try {
    const assistant = await fetchOpenAI("/assistants", "POST", {
      name: config.name,
      description: config.description,
      instructions: config.instructions,
      model: config.model || "gpt-4o",
      tools: config.tools || [{ type: "file_search" }],
    })

    return assistant
  } catch (error) {
    console.error("Error creating assistant:", error)
    throw error
  }
}

export async function updateAssistant(assistantId: string, config: Partial<AssistantConfig>) {
  try {
    const assistant = await fetchOpenAI(`/assistants/${assistantId}`, "PATCH", {
      name: config.name,
      description: config.description,
      instructions: config.instructions,
      model: config.model,
      tools: config.tools,
    })

    return assistant
  } catch (error) {
    console.error("Error updating assistant:", error)
    throw error
  }
}

export async function deleteAssistant(assistantId: string) {
  try {
    await fetchOpenAI(`/assistants/${assistantId}`, "DELETE")
  } catch (error) {
    console.error("Error deleting assistant:", error)
    throw error
  }
}

export async function getAssistant(assistantId: string) {
  try {
    const assistant = await fetchOpenAI(`/assistants/${assistantId}`)
    return assistant
  } catch (error) {
    console.error("Error retrieving assistant:", error)
    throw error
  }
}

export async function listAssistants(limit = 20) {
  try {
    const assistants = await fetchOpenAI("/assistants", "GET", {
      limit,
      order: "desc",
    })

    return assistants.data
  } catch (error: any) {
    throw error
  }
}

export async function createThread() {
  try {
    const thread = await fetchOpenAI("/threads", "POST")
    return thread
  } catch (error) {
    console.error("Error creating thread:", error)
    throw error
  }
}

export async function addMessageToThread(threadId: string, content: string, fileIds?: string[]) {
  try {
    const message = await fetchOpenAI(`/threads/${threadId}/messages`, "POST", {
      role: "user",
      content,
      attachments: fileIds?.map((id) => ({
        file_id: id,
        tools: [{ type: "file_search" as const }],
      })),
    })

    return message
  } catch (error) {
    console.error("Error adding message to thread:", error)
    throw error
  }
}

export async function runAssistant(threadId: string, assistantId: string) {
  try {
    const run = await fetchOpenAI(`/threads/${threadId}/runs`, "POST", {
      assistant_id: assistantId,
    })

    return run
  } catch (error) {
    console.error("Error running assistant:", error)
    throw error
  }
}

export async function getRunStatus(threadId: string, runId: string) {
  try {
    const run = await fetchOpenAI(`/threads/${threadId}/runs/${runId}`)
    return run
  } catch (error) {
    console.error("Error retrieving run status:", error)
    throw error
  }
}

export async function getThreadMessages(threadId: string) {
  try {
    const messages = await fetchOpenAI(`/threads/${threadId}/messages`)
    return messages.data
  } catch (error) {
    console.error("Error retrieving thread messages:", error)
    throw error
  }
}

export async function uploadFileForAssistant(file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file as any)
    formData.append("purpose", "assistants")

    const response = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || "dummy-key-for-build"}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error uploading file for assistant:", error)
    throw error
  }
}

export async function createVectorStore(name: string, fileIds: string[]) {
  try {
    const vectorStore = await fetchOpenAI("/vector_stores", "POST", {
      name,
      file_ids: fileIds,
    })

    return vectorStore
  } catch (error) {
    console.error("Error creating vector store:", error)
    throw error
  }
}
