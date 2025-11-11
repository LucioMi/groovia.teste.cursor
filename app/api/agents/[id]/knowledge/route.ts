import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { put } from "@vercel/blob"
import { uploadFileToOpenAI, addFilesToVectorStore } from "@/lib/openai-client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id

    const knowledgeBases = await sql`
      SELECT * FROM knowledge_bases
      WHERE agent_id = ${agentId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ knowledgeBases })
  } catch (error) {
    console.error("[v0] Error fetching knowledge bases:", error)
    return NextResponse.json({ error: "Failed to fetch knowledge bases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id
    const formData = await request.formData()

    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const syncToOpenAI = formData.get("syncToOpenAI") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading knowledge base file:", file.name)

    // Upload file to Vercel Blob
    const blob = await put(`knowledge-bases/${agentId}/${file.name}`, file, {
      access: "public",
    })

    // Extract text content from file (for searchability)
    let contentText = ""
    if (file.type.includes("text") || file.type.includes("json")) {
      contentText = await file.text()
    }

    // Save to database
    const result = await sql`
      INSERT INTO knowledge_bases (
        agent_id, name, description, file_url, file_type, file_size, content_text
      ) VALUES (
        ${agentId}, 
        ${name || file.name}, 
        ${description || ""}, 
        ${blob.url}, 
        ${file.type}, 
        ${file.size}, 
        ${contentText}
      )
      RETURNING *
    `

    const knowledgeBase = result[0]

    // Sync to OpenAI if requested and API key is configured
    let openaiFileId = null
    if (syncToOpenAI && process.env.OPENAI_API_KEY) {
      try {
        console.log("[v0] Syncing file to OpenAI...")

        // Upload to OpenAI
        const openaiFile = await uploadFileToOpenAI(file)
        openaiFileId = openaiFile.id

        // Save file reference
        await sql`
          INSERT INTO vector_store_files (agent_id, knowledge_base_id, openai_file_id, filename, status)
          VALUES (${agentId}, ${knowledgeBase.id}, ${openaiFileId}, ${file.name}, 'uploaded')
        `

        // Get agent's vector store ID
        const agents = await sql`
          SELECT openai_vector_store_id
          FROM agents
          WHERE id = ${agentId}
        `

        if (agents.length > 0 && agents[0].openai_vector_store_id) {
          const vectorStoreId = agents[0].openai_vector_store_id

          console.log("[v0] Adding file to vector store:", vectorStoreId)
          await addFilesToVectorStore(vectorStoreId, [openaiFileId])

          // Update sync status
          await sql`
            UPDATE vector_store_files
            SET openai_vector_store_id = ${vectorStoreId}, synced_at = NOW()
            WHERE openai_file_id = ${openaiFileId}
          `

          console.log("[v0] File synced to vector store successfully")
        }
      } catch (error) {
        console.error("[v0] Error syncing to OpenAI:", error)
        // Continue even if OpenAI sync fails
      }
    }

    return NextResponse.json({
      knowledgeBase: {
        ...knowledgeBase,
        openaiFileId,
        syncedToOpenAI: !!openaiFileId,
      },
    })
  } catch (error) {
    console.error("[v0] Error uploading knowledge base:", error)
    return NextResponse.json({ error: "Failed to upload knowledge base" }, { status: 500 })
  }
}
