import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    const organizationId = membership?.organization_id

    if (!organizationId) {
      return Response.json({ error: "No organization selected" }, { status: 400 })
    }

    const { conversationId } = await req.json()

    if (!conversationId) {
      return Response.json({ error: "Conversation ID is required" }, { status: 400 })
    }
    // </CHANGE>

    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle()

    if (convError || !conversation) {
      console.error("[v0] Conversation not found:", conversationId, convError)
      return Response.json({ error: "Conversation not found. Please start a new conversation." }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No messages found in this conversation" }, { status: 400 })
    }
    // </CHANGE>

    const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).maybeSingle()

    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 })
    }
    // </CHANGE>

    const lastAssistantMessage = messages.filter((m) => m.role === "assistant").pop()
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()

    const { data: approvedResponse, error: approveError } = await supabase
      .from("approved_responses")
      .insert({
        agent_id: agentId,
        conversation_id: conversationId,
        user_id: user.id,
        question: lastUserMessage?.content || "",
        response: lastAssistantMessage?.content || "",
      })
      .select()
      .single()

    if (approveError) {
      console.error("[v0] Error saving approved response:", approveError)
      return Response.json({ error: "Failed to save approved response" }, { status: 500 })
    }
    // </CHANGE>

    const { data: scan } = await supabase
      .from("scans")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("current_agent_id", agentId)
      .eq("status", "in_progress")
      .maybeSingle()

    const nextAgentId = agent.next_agent_id
    let isWorkflowComplete = false

    if (scan) {
      // Update or create scan step for this agent
      const { data: existingStep } = await supabase
        .from("scan_steps")
        .select("*")
        .eq("scan_id", scan.id)
        .eq("agent_id", agentId)
        .maybeSingle()

      if (existingStep) {
        await supabase
          .from("scan_steps")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
            approved_by: user.id,
            conversation_id: conversationId,
          })
          .eq("id", existingStep.id)
      } else {
        // Get the next order number
        const { data: steps } = await supabase
          .from("scan_steps")
          .select("step_order")
          .eq("scan_id", scan.id)
          .order("step_order", { ascending: false })
          .limit(1)

        const nextOrder = (steps?.[0]?.step_order || 0) + 1

        await supabase.from("scan_steps").insert({
          scan_id: scan.id,
          agent_id: agentId,
          conversation_id: conversationId,
          status: "completed",
          step_order: nextOrder,
          completed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
      }

      if (!nextAgentId) {
        isWorkflowComplete = true

        // Get all approved responses in order for this scan
        const { data: allSteps } = await supabase
          .from("scan_steps")
          .select(`
            *,
            agent:agents(name, description),
            conversation:conversations(*)
          `)
          .eq("scan_id", scan.id)
          .order("step_order", { ascending: true })

        if (allSteps && allSteps.length > 0) {
          // Build comprehensive document from all steps
          let documentContent = `# Jornada ${scan.title || "Completa"}\n\n`
          documentContent += `**Gerado em:** ${new Date().toLocaleString("pt-BR")}\n`
          documentContent += `**Organização:** ${organizationId}\n`
          documentContent += `**Usuário:** ${user.email}\n\n`
          documentContent += `---\n\n`

          for (const step of allSteps) {
            const agent = step.agent as any
            documentContent += `## ${agent.name}\n\n`
            documentContent += `**Descrição:** ${agent.description || "N/A"}\n\n`

            // Get all messages for this conversation
            const { data: stepMessages } = await supabase
              .from("messages")
              .select("*")
              .eq("conversation_id", step.conversation_id)
              .order("created_at", { ascending: true })

            if (stepMessages) {
              documentContent += `### Histórico da Conversa\n\n`
              for (const msg of stepMessages) {
                const roleLabel = msg.role === "user" ? "Usuário" : agent.name
                documentContent += `**${roleLabel}:** ${msg.content}\n\n`
              }
            }

            documentContent += `**Aprovado em:** ${new Date(step.approved_at).toLocaleString("pt-BR")}\n\n`
            documentContent += `---\n\n`
          }

          documentContent += `\n*Documento gerado automaticamente pelo sistema GrooveIA*\n`

          // Create final document
          const documentName = `Jornada-Completa-${scan.title?.replace(/\s+/g, "-") || "scan"}-${new Date().toISOString().split("T")[0]}.md`

          const { data: document, error: docError } = await supabase
            .from("documents")
            .insert({
              user_id: user.id,
              agent_id: agentId, // Last agent in workflow
              name: documentName,
              content: documentContent,
            })
            .select()
            .single()

          if (docError) {
            console.error("[v0] Error creating final document:", docError)
          } else {
            console.log("[v0] Final workflow document created:", document.id)

            // Update scan with document reference
            await supabase
              .from("scans")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                metadata: {
                  ...(scan.metadata as any),
                  final_document_id: document.id,
                  final_document_name: documentName,
                },
              })
              .eq("id", scan.id)

            return Response.json({
              success: true,
              workflowComplete: true,
              approvedResponseId: approvedResponse.id,
              finalDocumentId: document.id,
              finalDocumentName: documentName,
              message: "Jornada completa! Documento final gerado com sucesso.",
            })
          }
        }

        // Fallback if document generation fails
        await supabase
          .from("scans")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", scan.id)
      } else {
        // Move to next agent in workflow
        await supabase
          .from("scans")
          .update({
            current_agent_id: nextAgentId,
          })
          .eq("id", scan.id)
      }
    }
    // </CHANGE>

    return Response.json({
      success: true,
      workflowComplete: isWorkflowComplete,
      approvedResponseId: approvedResponse.id,
      nextAgentId: nextAgentId,
      message: isWorkflowComplete
        ? "Última etapa aprovada! Documento final sendo gerado..."
        : "Resposta aprovada! Avançando para próxima etapa.",
    })
  } catch (error) {
    console.error("[v0] Error approving response:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
