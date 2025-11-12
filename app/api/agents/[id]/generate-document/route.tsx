export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { put } from "@vercel/blob"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] [GEN-DOC] ========== STARTING DOCUMENT GENERATION ==========")
    console.log("[v0] [GEN-DOC] Agent ID:", agentId)

    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error("[v0] [GEN-DOC] Authentication failed:", authError)
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] [GEN-DOC] User authenticated:", user.id, user.email)

    const supabase = createServiceClient()

    const body = await req.json()
    const { conversationId, approvedMessageIds } = body

    console.log("[v0] [GEN-DOC] Request body received:")
    console.log("[v0] [GEN-DOC] - conversationId:", conversationId)
    console.log("[v0] [GEN-DOC] - approvedMessageIds:", approvedMessageIds)

    if (!conversationId || !approvedMessageIds || approvedMessageIds.length === 0) {
      console.error("[v0] [GEN-DOC] Validation failed - missing required fields")
      return Response.json({ error: "Conversation ID and approved message IDs are required" }, { status: 400 })
    }

    // Get conversation first to check if it has organization_id
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle()

    if (convError || !conversation) {
      console.error("[v0] [GEN-DOC] Conversation not found:", convError)
      return Response.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Try to get organization_id from conversation first, then from scan, then from user membership
    let organizationId = conversation.organization_id

    if (!organizationId) {
      console.log("[v0] [GEN-DOC] No organization_id in conversation, trying scan_step...")
      // Try to get from scan_step if conversation is linked to a scan
      const { data: scanStep, error: scanStepError } = await supabase
        .from("scan_steps")
        .select("scan_id")
        .eq("conversation_id", conversationId)
        .maybeSingle()

      if (scanStep && !scanStepError && scanStep.scan_id) {
        console.log("[v0] [GEN-DOC] Found scan_step, fetching scan organization_id...")
        const { data: scan, error: scanError } = await supabase
          .from("scans")
          .select("organization_id")
          .eq("id", scanStep.scan_id)
          .maybeSingle()

        if (scan && !scanError && scan.organization_id) {
          organizationId = scan.organization_id
          console.log("[v0] [GEN-DOC] Found organization_id from scan:", organizationId)
        }
      }
    }

    if (!organizationId) {
      console.log("[v0] [GEN-DOC] No organization_id in conversation or scan, trying user membership...")
      const { data: membership } = await supabase
        .from("organization_memberships")
        .select("organization_id")
        .eq("user_id", user.id)
        .maybeSingle()

      organizationId = membership?.organization_id
    }

    console.log("[v0] [GEN-DOC] Organization ID:", organizationId)

    if (!organizationId) {
      console.error("[v0] [GEN-DOC] No organization found for user, conversation, or scan")
      return Response.json({ 
        error: "No organization selected", 
        details: "User needs to be part of an organization, or conversation/scan must have an organization_id"
      }, { status: 400 })
    }

    const { data: agent } = await supabase.from("agents").select("*").eq("id", agentId).maybeSingle()

    if (!agent) {
      console.error("[v0] [GEN-DOC] Agent not found:", agentId)
      return Response.json({ error: "Agent not found" }, { status: 404 })
    }

    console.log("[v0] [GEN-DOC] Agent loaded:", agent.name)

    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (!allMessages || allMessages.length === 0) {
      console.error("[v0] [GEN-DOC] No messages found in conversation")
      return Response.json({ error: "No messages found" }, { status: 400 })
    }

    console.log("[v0] [GEN-DOC] Total messages in conversation:", allMessages.length)
    console.log(
      "[v0] [GEN-DOC] Message IDs in database:",
      allMessages.map((m) => m.id),
    )
    console.log("[v0] [GEN-DOC] Approved message IDs from request:", approvedMessageIds)

    const approvedSet = new Set(approvedMessageIds)
    const includedMessages: any[] = []

    for (let i = 0; i < allMessages.length; i++) {
      const message = allMessages[i]
      const isApproved =
        message.role === "assistant" &&
        (approvedSet.has(message.id) ||
          Array.from(approvedSet).some((approvedId) => message.id.startsWith(approvedId as string)))

      if (isApproved) {
        console.log("[v0] [GEN-DOC] Found approved assistant message:", message.id)
        // Include the user message before this assistant message if it exists
        if (i > 0 && allMessages[i - 1].role === "user") {
          console.log("[v0] [GEN-DOC] Including preceding user message:", allMessages[i - 1].id)
          includedMessages.push(allMessages[i - 1])
        }
        includedMessages.push(message)
      }
    }

    if (includedMessages.length === 0) {
      console.error("[v0] [GEN-DOC] No approved messages found matching the IDs")
      console.error("[v0] [GEN-DOC] Attempted to match:", approvedMessageIds)
      console.error(
        "[v0] [GEN-DOC] Against database IDs:",
        allMessages.filter((m) => m.role === "assistant").map((m) => m.id),
      )
      return Response.json(
        {
          error: "No approved messages found",
          debug: {
            requestedIds: approvedMessageIds,
            availableIds: allMessages.filter((m) => m.role === "assistant").map((m) => m.id),
          },
        },
        { status: 404 },
      )
    }

    console.log("[v0] [GEN-DOC] Total messages included in document:", includedMessages.length)

    console.log("[v0] [GEN-DOC] Generating HTML document...")

    const htmlContent = generateHTMLDocument({
      agentName: agent.name,
      userEmail: user.email!,
      approvedCount: approvedMessageIds.length,
      messages: includedMessages,
    })

    const agentNameSafe = agent.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()
    const timestamp = new Date().toISOString().split("T")[0]
    const documentName = `${agentNameSafe}-${timestamp}.html`

    console.log("[v0] [GEN-DOC] Uploading HTML to Vercel Blob...")

    const blob = await put(`documents/${organizationId}/${documentName}`, htmlContent, {
      access: "public",
      addRandomSuffix: true,
      contentType: "text/html",
    })

    console.log("[v0] [GEN-DOC] HTML uploaded to Blob:", blob.url)

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        agent_id: agentId,
        conversation_id: conversationId,
        name: documentName,
        file_url: blob.url,
        file_type: "text/html",
        file_size: blob.size,
        content: includedMessages.map((m) => `[${m.role}]: ${m.content}`).join("\n\n"),
      })
      .select()
      .single()

    if (docError) {
      console.error("[v0] [GEN-DOC] Error creating document:", docError)
      return Response.json({ error: "Failed to create document" }, { status: 500 })
    }

    console.log("[v0] [GEN-DOC] Document saved to database:", document.id)

    // Vincular documento ao scan_step se a conversa estiver vinculada a uma jornada scan
    try {
      const { data: scanStep, error: scanStepError } = await supabase
        .from("scan_steps")
        .select("id, scan_id, step_order")
        .eq("conversation_id", conversationId)
        .maybeSingle()

      if (scanStep && !scanStepError) {
        console.log("[v0] [GEN-DOC] Found scan_step linked to conversation:", scanStep.id)

        // Atualizar scan_step com output_document_id
        const { error: updateError } = await supabase
          .from("scan_steps")
          .update({
            output_document_id: document.id,
            document_url: blob.url,
          })
          .eq("id", scanStep.id)

        if (updateError) {
          console.error("[v0] [GEN-DOC] Error updating scan_step:", updateError)
        } else {
          console.log("[v0] [GEN-DOC] Scan step updated with document:", scanStep.id)

          // Vincular na tabela scan_step_documents
          const { error: linkError } = await supabase
            .from("scan_step_documents")
            .insert({
              scan_step_id: scanStep.id,
              document_id: document.id,
              document_type: "output",
            })

          if (linkError) {
            // Se já existe, não é um erro crítico
            console.log("[v0] [GEN-DOC] Document link may already exist or error:", linkError.message)
          } else {
            console.log("[v0] [GEN-DOC] Document linked to scan_step_documents")
          }
        }
      } else {
        console.log("[v0] [GEN-DOC] No scan_step found for this conversation (not part of a scan journey)")
      }
    } catch (linkError) {
      // Não falhar a geração do documento se a vinculação falhar
      console.error("[v0] [GEN-DOC] Error linking document to scan_step (non-critical):", linkError)
    }

    console.log("[v0] [GEN-DOC] ========== DOCUMENT GENERATION COMPLETE ==========")

    return Response.json({
      success: true,
      documentId: document.id,
      documentName: documentName,
      documentUrl: blob.url,
      approvedCount: approvedMessageIds.length,
      message: "Documento HTML gerado com sucesso!",
    })
  } catch (error) {
    console.error("[v0] [GEN-DOC] FATAL ERROR:", error)
    console.error("[v0] [GEN-DOC] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateHTMLDocument({
  agentName,
  userEmail,
  approvedCount,
  messages,
}: {
  agentName: string
  userEmail: string
  approvedCount: number
  messages: Array<{ role: string; content: string; created_at: string }>
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conversa com ${escapeHtml(agentName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: #f9fafb;
      padding: 40px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      border-radius: 12px;
    }
    .header {
      border-bottom: 3px solid #0070f3;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      color: #0070f3;
      margin-bottom: 12px;
    }
    .metadata {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    .message {
      margin-bottom: 32px;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    .message.user {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-left: 4px solid #6366f1;
    }
    .message.assistant {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 4px solid #0284c7;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    .role {
      font-weight: 700;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .role.user { color: #6366f1; }
    .role.assistant { color: #0284c7; }
    .timestamp {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }
    .content {
      font-size: 15px;
      line-height: 1.8;
      color: #374151;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .footer {
      margin-top: 60px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }
    .footer p { margin: 4px 0; }
    @media print {
      body { padding: 0; background: white; }
      .container { box-shadow: none; padding: 40px; }
    }
    @media (max-width: 768px) {
      .container { padding: 30px 20px; }
      .header h1 { font-size: 28px; }
      .message { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Conversa com ${escapeHtml(agentName)}</h1>
      <div class="metadata">📧 Usuário: ${escapeHtml(userEmail)}</div>
      <div class="metadata">✅ Mensagens aprovadas: ${approvedCount}</div>
      <div class="metadata">📅 Gerado em: ${new Date().toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short",
      })}</div>
    </div>
    <div class="messages">
      ${messages
        .map(
          (msg) => `
        <div class="message ${msg.role}">
          <div class="message-header">
            <span class="role ${msg.role}">${msg.role === "user" ? "👤 Você" : `🤖 ${escapeHtml(agentName)}`}</span>
            <span class="timestamp">${new Date(msg.created_at).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}</span>
          </div>
          <div class="content">${escapeHtml(msg.content)}</div>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="footer">
      <p><strong>Documento gerado pela plataforma Groovia</strong></p>
      <p>© ${new Date().getFullYear()} Groovia. Todos os direitos reservados.</p>
      <p style="margin-top: 12px; font-size: 11px;">Para imprimir como PDF, use Ctrl+P (ou Cmd+P) e selecione "Salvar como PDF"</p>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
