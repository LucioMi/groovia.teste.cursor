// Evita problemas de compatibilidade do SDK no ambiente v0

const OPENAI_API_BASE = "https://api.openai.com/v1"
const OPENAI_BETA_HEADER = "assistants=v2"

function getHeaders() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada")
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": OPENAI_BETA_HEADER,
  }
}

export async function createAssistantWithVectorStore(config: {
  name: string
  description: string
  instructions: string
  model?: string
  vectorStoreId?: string
}) {
  console.log("[v0] Creating assistant with vector store...")

  const body: any = {
    name: config.name,
    description: config.description,
    instructions: config.instructions,
    model: config.model || "gpt-4o",
    tools: [{ type: "file_search" }],
  }

  if (config.vectorStoreId) {
    body.tool_resources = {
      file_search: {
        vector_store_ids: [config.vectorStoreId],
      },
    }
  }

  const response = await fetch(`${OPENAI_API_BASE}/assistants`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error creating assistant:", error)
    throw new Error(`Failed to create assistant: ${response.status}`)
  }

  const assistant = await response.json()
  console.log("[v0] Assistant created:", assistant.id)
  return assistant
}

export async function updateAssistantVectorStore(assistantId: string, vectorStoreId: string) {
  console.log("[v0] Updating assistant with vector store...")

  const response = await fetch(`${OPENAI_API_BASE}/assistants/${assistantId}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId],
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error updating assistant:", error)
    throw new Error(`Failed to update assistant: ${response.status}`)
  }

  return await response.json()
}

export async function uploadFileToOpenAI(file: File) {
  console.log("[v0] Uploading file to OpenAI:", file.name)

  const formData = new FormData()
  formData.append("file", file)
  formData.append("purpose", "assistants")

  const response = await fetch(`${OPENAI_API_BASE}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error uploading file:", error)
    throw new Error(`Failed to upload file: ${response.status}`)
  }

  const fileData = await response.json()
  console.log("[v0] File uploaded:", fileData.id)
  return fileData
}

export async function createVectorStore(name: string, fileIds: string[]) {
  console.log("[v0] Creating vector store:", name, "with", fileIds.length, "files")

  const response = await fetch(`${OPENAI_API_BASE}/vector_stores`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name,
      file_ids: fileIds,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error creating vector store:", error)
    throw new Error(`Failed to create vector store: ${response.status}`)
  }

  const vectorStore = await response.json()
  console.log("[v0] Vector store created:", vectorStore.id)
  return vectorStore
}

export async function addFilesToVectorStore(vectorStoreId: string, fileIds: string[]) {
  console.log("[v0] Adding files to vector store:", vectorStoreId)

  const promises = fileIds.map((fileId) =>
    fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}/files`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ file_id: fileId }),
    }),
  )

  const responses = await Promise.all(promises)
  const results = await Promise.all(responses.map((r) => (r.ok ? r.json() : null)))

  console.log("[v0] Files added to vector store:", results.filter((r) => r).length)
  return results.filter((r) => r)
}

export async function deleteVectorStore(vectorStoreId: string) {
  console.log("[v0] Deleting vector store:", vectorStoreId)

  const response = await fetch(`${OPENAI_API_BASE}/vector_stores/${vectorStoreId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })

  if (!response.ok) {
    console.error("[v0] Error deleting vector store:", response.status)
    throw new Error(`Failed to delete vector store: ${response.status}`)
  }

  return await response.json()
}

export async function getAssistant(assistantId: string) {
  console.log("[v0] Fetching assistant:", assistantId)

  const response = await fetch(`${OPENAI_API_BASE}/assistants/${assistantId}`, {
    method: "GET",
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error fetching assistant:", error)
    throw new Error(`Failed to fetch assistant: ${response.status}`)
  }

  const assistant = await response.json()
  console.log("[v0] Assistant fetched:", assistant.name)
  return assistant
}

export async function deleteAssistant(assistantId: string) {
  console.log("[v0] Deleting assistant:", assistantId)

  const response = await fetch(`${OPENAI_API_BASE}/assistants/${assistantId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error("[v0] Error deleting assistant:", error)
    throw new Error(`Failed to delete assistant: ${response.status}`)
  }

  const result = await response.json()
  console.log("[v0] Assistant deleted successfully")
  return result
}
