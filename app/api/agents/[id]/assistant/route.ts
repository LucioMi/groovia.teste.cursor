import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  createAssistantWithVectorStore,
  updateAssistantVectorStore,
  createVectorStore,
  uploadFileToOpenAI,
  getAssistant,
  deleteAssistant,
  deleteVectorStore,
} from "@/lib/openai-client"

// GET - Get OpenAI Assistant info for an agent
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id

    console.log("[v0] Fetching assistant for agent:", agentId)

    const agents = await sql`
      SELECT openai_assistant_id, openai_synced_at
      FROM agents
      WHERE id = ${agentId}
    `

    if (agents.length === 0) {
      console.error("[v0] Agent not found:", agentId)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]

    if (!agent.openai_assistant_id) {
      console.log("[v0] No assistant linked to agent")
      return NextResponse.json({ assistant: null })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[v0] OpenAI API key not configured")
      return NextResponse.json(
        { error: "OpenAI API key não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente." },
        { status: 400 },
      )
    }

    console.log("[v0] Fetching assistant from OpenAI:", agent.openai_assistant_id)
    // Get assistant details from OpenAI
    const assistant = await getAssistant(agent.openai_assistant_id)
    console.log("[v0] Assistant fetched successfully:", assistant.name)

    return NextResponse.json({
      assistant: {
        id: assistant.id,
        name: assistant.name,
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools,
        syncedAt: agent.openai_synced_at,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error fetching assistant:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch assistant" }, { status: 500 })
  }
}

// POST - Create or sync OpenAI Assistant for an agent
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("[v0] OpenAI API key not configured")
      return NextResponse.json(
        { error: "OpenAI API key não configurada. Adicione OPENAI_API_KEY nas variáveis de ambiente." },
        { status: 400 },
      )
    }

    const agentId = params.id
    console.log("[v0] Creating/syncing assistant with vector store for agent:", agentId)

    // Get agent details
    const agents = await sql`
      SELECT id, name, description, system_prompt, openai_assistant_id, openai_vector_store_id
      FROM agents
      WHERE id = ${agentId}
    `

    if (agents.length === 0) {
      console.error("[v0] Agent not found:", agentId)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]
    console.log("[v0] Agent found:", agent.name)

    // Get knowledge bases for this agent
    const knowledgeBases = await sql`
      SELECT id, name, file_url
      FROM knowledge_bases
      WHERE agent_id = ${agentId} AND is_active = true
    `

    console.log("[v0] Found", knowledgeBases.length, "knowledge bases")

    let vectorStoreId = agent.openai_vector_store_id
    let assistant

    // Create or update vector store if there are knowledge bases
    if (knowledgeBases.length > 0) {
      console.log("[v0] Processing knowledge bases...")

      // Check which files are already uploaded
      const existingFiles = await sql`
        SELECT openai_file_id, knowledge_base_id
        FROM vector_store_files
        WHERE agent_id = ${agentId}
      `

      const existingFileIds = new Set(existingFiles.map((f: any) => f.knowledge_base_id))
      const newKnowledgeBases = knowledgeBases.filter((kb: any) => !existingFileIds.has(kb.id))

      console.log("[v0] New files to upload:", newKnowledgeBases.length)

      // Upload new files to OpenAI
      const uploadedFileIds: string[] = []
      for (const kb of newKnowledgeBases) {
        try {
          console.log("[v0] Fetching file from:", kb.file_url)
          const fileResponse = await fetch(kb.file_url)
          const fileBlob = await fileResponse.blob()
          const file = new File([fileBlob], kb.name, { type: fileBlob.type })

          const uploadedFile = await uploadFileToOpenAI(file)

          // Save file reference
          await sql`
            INSERT INTO vector_store_files (agent_id, knowledge_base_id, openai_file_id, filename, status)
            VALUES (${agentId}, ${kb.id}, ${uploadedFile.id}, ${kb.name}, 'uploaded')
          `

          uploadedFileIds.push(uploadedFile.id)
        } catch (error) {
          console.error("[v0] Error uploading file:", kb.name, error)
        }
      }

      // Get all uploaded file IDs
      const allFiles = await sql`
        SELECT openai_file_id
        FROM vector_store_files
        WHERE agent_id = ${agentId} AND status = 'uploaded'
      `

      const allFileIds = allFiles.map((f: any) => f.openai_file_id)

      console.log("[v0] Total files for vector store:", allFileIds.length)

      // Create or update vector store
      if (!vectorStoreId && allFileIds.length > 0) {
        console.log("[v0] Creating new vector store...")
        const vectorStore = await createVectorStore(`${agent.name} - Knowledge Base`, allFileIds)
        vectorStoreId = vectorStore.id

        // Save vector store ID
        await sql`
          UPDATE agents
          SET openai_vector_store_id = ${vectorStoreId}
          WHERE id = ${agentId}
        `

        // Update file records
        await sql`
          UPDATE vector_store_files
          SET openai_vector_store_id = ${vectorStoreId}, synced_at = NOW()
          WHERE agent_id = ${agentId}
        `

        console.log("[v0] Vector store created:", vectorStoreId)
      }
    }

    // Create or update assistant
    if (agent.openai_assistant_id) {
      console.log("[v0] Updating existing assistant:", agent.openai_assistant_id)

      if (vectorStoreId) {
        assistant = await updateAssistantVectorStore(agent.openai_assistant_id, vectorStoreId)
      }

      console.log("[v0] Assistant updated successfully")
    } else {
      console.log("[v0] Creating new assistant with vector store...")

      assistant = await createAssistantWithVectorStore({
        name: agent.name,
        description: agent.description || "",
        instructions: agent.system_prompt || "",
        vectorStoreId: vectorStoreId || undefined,
      })

      console.log("[v0] Assistant created:", assistant.id)

      // Update agent with assistant ID
      await sql`
        UPDATE agents
        SET openai_assistant_id = ${assistant.id},
            openai_synced_at = NOW()
        WHERE id = ${agentId}
      `
      console.log("[v0] Agent updated with assistant ID")
    }

    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
        vectorStoreId: vectorStoreId,
        filesCount: knowledgeBases.length,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error creating/updating assistant:", error)
    return NextResponse.json({ error: error.message || "Failed to create/update assistant" }, { status: 500 })
  }
}

// DELETE - Remove OpenAI Assistant
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    console.log("[v0] Deleting assistant for agent:", agentId)

    const agents = await sql`
      SELECT openai_assistant_id, openai_vector_store_id
      FROM agents
      WHERE id = ${agentId}
    `

    if (agents.length === 0) {
      console.error("[v0] Agent not found:", agentId)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agents[0]

    if (agent.openai_assistant_id) {
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey) {
        console.log("[v0] Deleting assistant from OpenAI:", agent.openai_assistant_id)
        // Delete from OpenAI
        await deleteAssistant(agent.openai_assistant_id)
        console.log("[v0] Assistant deleted from OpenAI")
      } else {
        console.warn("[v0] OpenAI not configured, skipping OpenAI deletion")
      }

      // Remove from database
      await sql`
        UPDATE agents
        SET openai_assistant_id = NULL,
            openai_thread_id = NULL,
            openai_synced_at = NULL
        WHERE id = ${agentId}
      `
      console.log("[v0] Assistant unlinked from agent in database")
    }

    if (agent.openai_vector_store_id) {
      const apiKey = process.env.OPENAI_API_KEY
      if (apiKey) {
        console.log("[v0] Deleting vector store from OpenAI:", agent.openai_vector_store_id)
        // Delete from OpenAI
        await deleteVectorStore(agent.openai_vector_store_id)
        console.log("[v0] Vector store deleted from OpenAI")
      } else {
        console.warn("[v0] OpenAI not configured, skipping OpenAI vector store deletion")
      }

      // Remove from database
      await sql`
        UPDATE agents
        SET openai_vector_store_id = NULL
        WHERE id = ${agentId}
      `
      console.log("[v0] Vector store unlinked from agent in database")
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting assistant:", error)
    return NextResponse.json({ error: error.message || "Failed to delete assistant" }, { status: 500 })
  }
}
