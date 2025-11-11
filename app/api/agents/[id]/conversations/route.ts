import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] [CONV-API] === GET CONVERSATIONS START ===")
    console.log("[v0] [CONV-API] Agent ID:", agentId)

    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    console.log("[v0] [CONV-API] Auth check - User ID:", user?.id || "NONE")
    console.log("[v0] [CONV-API] Auth error:", authError?.message || "none")

    if (authError || !user) {
      console.log("[v0] [CONV-API] UNAUTHORIZED - No user session")
      return NextResponse.json({ error: "Unauthorized", conversations: [] }, { status: 401 })
    }

    const supabase = createServiceClient()

    console.log("[v0] [CONV-API] Looking up organization for user:", user.id)
    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      console.error("[v0] [CONV-API] Membership error:", membershipError)
    }

    const organizationId = membership?.organization_id
    console.log("[v0] [CONV-API] Organization ID:", organizationId || "NONE")

    console.log("[v0] [CONV-API] Querying conversations table...")
    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id, agent_id, user_id, organization_id, title, message_count, created_at, updated_at, last_message_at")
      .eq("agent_id", agentId)
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })

    if (convError) {
      console.error("[v0] [CONV-API] Query error:", convError)
      return NextResponse.json({
        conversations: [],
        error: convError.message,
      })
    }

    console.log("[v0] [CONV-API] Found conversations:", conversations?.length || 0)

    if (conversations && conversations.length > 0) {
      const mostRecentConversation = conversations[0]
      console.log("[v0] [CONV-API] Most recent conversation:", mostRecentConversation.id)

      console.log("[v0] [CONV-API] Loading messages...")
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("id, conversation_id, agent_id, role, content, created_at")
        .eq("conversation_id", mostRecentConversation.id)
        .order("created_at", { ascending: true })

      if (messagesError) {
        console.error("[v0] [CONV-API] Messages error:", messagesError)
      }

      console.log("[v0] [CONV-API] Loaded messages:", messages?.length || 0)
      console.log("[v0] [CONV-API] === GET CONVERSATIONS SUCCESS ===")

      return NextResponse.json({
        conversations: conversations,
        conversationId: mostRecentConversation.id,
        messages: messages || [],
      })
    }

    console.log("[v0] [CONV-API] No conversations found - returning empty")
    console.log("[v0] [CONV-API] === GET CONVERSATIONS END ===")
    return NextResponse.json({ conversations: [], messages: [] })
  } catch (error) {
    console.error("[v0] [CONV-API] EXCEPTION:", error)
    return NextResponse.json({
      conversations: [],
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params

    console.log("[v0] [CONV-API] === POST CREATE CONVERSATION START ===")
    console.log("[v0] [CONV-API] Agent ID:", agentId)

    const supabaseAuth = await createServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.log("[v0] [CONV-API] UNAUTHORIZED")
      return NextResponse.json({ error: "Unauthorized", conversation: null }, { status: 401 })
    }

    const body = await request.json()
    const { title = "New Conversation" } = body

    console.log("[v0] [CONV-API] Creating conversation for user:", user.id)

    const supabase = createServiceClient()

    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    const organizationId = membership?.organization_id
    console.log("[v0] [CONV-API] Organization ID:", organizationId || "NONE")

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        agent_id: agentId,
        user_id: user.id,
        organization_id: organizationId,
        title,
        message_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !conversation) {
      console.error("[v0] [CONV-API] Failed to create:", error)
      return NextResponse.json({ error: "Failed to create conversation", conversation: null }, { status: 500 })
    }

    console.log("[v0] [CONV-API] Conversation created:", conversation.id)
    console.log("[v0] [CONV-API] === POST CREATE CONVERSATION SUCCESS ===")

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("[v0] [CONV-API] EXCEPTION:", error)
    return NextResponse.json(
      {
        error: "Failed to create conversation",
        details: error instanceof Error ? error.message : String(error),
        conversation: null,
      },
      { status: 500 },
    )
  }
}
