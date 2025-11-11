import { sql } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"
import { streamText } from "ai"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { message, test_case_id } = body

    // Get agent details
    const agentResult = await sql`SELECT * FROM agents WHERE id = ${id}`
    if (agentResult.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }
    const agent = agentResult[0]

    // Get agent rules and behaviors
    const rules =
      await sql`SELECT * FROM agent_rules WHERE agent_id = ${id} AND is_active = true ORDER BY priority DESC`
    const behaviors = await sql`SELECT * FROM agent_behaviors WHERE agent_id = ${id} AND is_active = true`

    // Build enhanced system prompt with rules and behaviors
    let enhancedPrompt = agent.system_prompt || ""

    if (behaviors.length > 0) {
      enhancedPrompt += "\n\nComportamentos configurados:\n"
      behaviors.forEach((b: any) => {
        enhancedPrompt += `- ${b.name}: ${b.description}\n`
      })
    }

    if (rules.length > 0) {
      enhancedPrompt += "\n\nRegras ativas:\n"
      rules.forEach((r: any) => {
        enhancedPrompt += `- ${r.name} (${r.rule_type}): ${r.description}\n`
      })
    }

    // Generate response using AI SDK
    const result = await streamText({
      model: "openai/gpt-4o-mini",
      system: enhancedPrompt,
      messages: [{ role: "user", content: message }],
    })

    const response = await result.text

    // Save test result if test_case_id provided
    if (test_case_id) {
      await sql`
        UPDATE agent_test_cases
        SET 
          status = 'passed',
          last_run_at = NOW(),
          last_result = ${JSON.stringify({ response, timestamp: new Date() })}
        WHERE id = ${test_case_id}
      `
    }

    // Log analytics
    await sql`
      INSERT INTO agent_analytics (agent_id, metric_type, metric_value, metadata)
      VALUES (${id}, 'test_run', 1, ${JSON.stringify({ message, response })})
    `

    return NextResponse.json({ response, agent_name: agent.name })
  } catch (error) {
    console.error("[v0] Error testing agent:", error)
    return NextResponse.json({ error: "Failed to test agent" }, { status: 500 })
  }
}
