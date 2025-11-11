import { sql } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string; conversationId: string } }) {
  try {
    const { conversationId, id: agentId } = params

    console.log("[v0] Generating document for conversation:", conversationId)

    // Get all approved responses
    const responses = await sql`
      SELECT * FROM approved_responses
      WHERE conversation_id = ${conversationId}
      ORDER BY order_index ASC
    `

    const approvedResponses = Array.isArray(responses) ? responses : []

    // Get agent info
    const agentResult = await sql`
      SELECT * FROM agents WHERE id = ${agentId}
    `
    const agent = Array.isArray(agentResult) ? agentResult[0] : null

    // Get conversation info
    const convResult = await sql`
      SELECT * FROM conversations WHERE id = ${conversationId}
    `
    const conversation = Array.isArray(convResult) ? convResult[0] : null

    // Generate document content
    const documentContent = generateDocument(agent, conversation, approvedResponses)

    return NextResponse.json({
      success: true,
      document: documentContent,
      approvedCount: approvedResponses.length,
    })
  } catch (error) {
    console.error("[v0] Error generating document:", error)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
  }
}

function generateDocument(agent: any, conversation: any, responses: any[]) {
  const header = `# Documento Final - ${agent?.name || "Agente"}
Data: ${new Date().toLocaleDateString("pt-BR")}
Conversa: ${conversation?.title || "Sem título"}

---

`

  const content = responses
    .map((r, index) => {
      return `## ${index + 1}. ${r.question}

${r.response}

---

`
    })
    .join("\n")

  const footer = `
---

**Total de respostas validadas:** ${responses.length}
**Gerado em:** ${new Date().toLocaleString("pt-BR")}
`

  return header + content + footer
}
