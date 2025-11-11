import { generateText } from "ai"
import { sql } from "@/lib/db"

export async function POST(req: Request, { params }: { context: { params: Promise<{ id: string }> } }) {
  try {
    const { id } = await params
    const { messages, documentType } = await req.json()

    const agentResult = await sql`
      SELECT * FROM agents WHERE id = ${id}
    `

    if (agentResult.length === 0) {
      return Response.json({ error: "Agent not found" }, { status: 404 })
    }

    const agent = agentResult[0]

    const { text } = await generateText({
      model: "openai/gpt-5",
      prompt: `Com base na conversa a seguir, gere um documento estruturado do tipo "${documentType}" para o agente ${agent.name}.

Conversa:
${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

O documento deve ser completo, profissional e seguir as melhores práticas para ${documentType}.`,
      maxOutputTokens: 8000,
    })

    const documentResult = await sql`
      INSERT INTO documents (name, content, agent_id, user_id, created_at)
      VALUES (${`${agent.name} - ${documentType}`}, ${text}, ${id}, 'current-user', NOW())
      RETURNING *
    `

    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: id,
        event_type: "document.generated",
        data: { document_id: documentResult[0].id, document_type: documentType },
      }),
    })

    return Response.json({ document: documentResult[0] })
  } catch (error) {
    console.error("[v0] Error generating document:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
