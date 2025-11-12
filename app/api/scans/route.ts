import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET - List all scans for user's organization
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Get user's organization
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 404 })
    }

    // Get all scans for the organization
    const { data: scans, error } = await supabase
      .from("scans")
      .select(
        `
        *,
        scan_steps (
          id,
          agent_id,
          step_order,
          step_type,
          status,
          depends_on_step_ids,
          manual_document_uploaded,
          completed_at
        )
      `,
      )
      .eq("organization_id", membership.organization_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching scans:", error)
      return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 })
    }

    return NextResponse.json({ scans: scans || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new scan for organization
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(cookieStore)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    const supabase = createServiceClient()

    // Get user's organization
    console.log("[v0] [CREATE-SCAN] User ID:", user.id, "Email:", user.email)
    const { data: membership, error: membershipError } = await supabase
      .from("organization_memberships")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (membershipError) {
      console.error("[v0] [CREATE-SCAN] Error fetching membership:", membershipError)
      return NextResponse.json({ error: "Failed to fetch organization membership" }, { status: 500 })
    }

    if (!membership?.organization_id) {
      console.error("[v0] [CREATE-SCAN] No organization membership found for user:", user.id)
      
      // Try to find organization from user_preferences as fallback (for debugging)
      const { data: preference } = await supabase
        .from("user_preferences")
        .select("selected_organization_id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (preference?.selected_organization_id) {
        console.log("[v0] [CREATE-SCAN] Found organization in preferences but no membership:", preference.selected_organization_id)
        return NextResponse.json({ 
          error: "No organization membership found",
          details: "User has organization in preferences but no membership record. Please ensure the user is properly added to an organization."
        }, { status: 404 })
      }

      return NextResponse.json({ 
        error: "No organization found",
        details: "User needs to be part of an organization to create scans. Please ensure the user is added to an organization."
      }, { status: 404 })
    }

    console.log("[v0] [CREATE-SCAN] Organization ID:", membership.organization_id, "Role:", membership.role)

    // Get all active agents from "Jornada Scan" category ordered by next_agent_id to build the flow
    const { data: agents } = await supabase
      .from("agents")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${membership.organization_id}`)
      .eq("status", "active")
      .eq("category", "Jornada Scan")
      .order("created_at")

    if (!agents || agents.length === 0) {
      console.error("[v0] [CREATE-SCAN] No agents found for Jornada Scan category")
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }

    console.log("[v0] [CREATE-SCAN] Found", agents.length, "agents for Jornada Scan")

    // Create the scan
    console.log("[v0] [CREATE-SCAN] Creating scan with organization_id:", membership.organization_id)
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        organization_id: membership.organization_id,
        created_by: user.id,
        title: title || "Novo SCAN",
        status: "in_progress",
        current_agent_id: agents[0].id,
      })
      .select()
      .single()

    if (scanError || !scan) {
      console.error("[v0] [CREATE-SCAN] Error creating scan:", scanError)
      return NextResponse.json({ error: "Failed to create scan", details: scanError?.message }, { status: 500 })
    }

    console.log("[v0] [CREATE-SCAN] Scan created successfully:", scan.id)

    // Create scan steps based on agent flow
    // Estrutura esperada: 
    // Etapa 1: SCAN (agent) -> sem dependências
    // Etapa 2: SCAN Clarity (document) -> depende de 1
    // Etapa 3: Mercado ICP (autonomous) -> depende de 1
    // Etapa 4: Persona (autonomous) -> depende de 1, 2, 3
    // Etapa 5: Sintetizador (agent) -> depende de 2
    // Etapa 6: GROOVIA INTELLIGENCE (autonomous/synthetic) -> depende de 1, 2, 3, 4, 5
    
    console.log("[v0] [CREATE-SCAN] Building scan steps from agents...")
    console.log("[v0] [CREATE-SCAN] Agents found:", agents.map(a => ({ name: a.name, id: a.id, is_passive: a.is_passive, next_agent_id: a.next_agent_id })))
    
    const scanSteps = []
    const agentMap = new Map(agents.map(a => [a.id, a]))
    const agentNameMap = new Map(agents.map(a => [a.name, a]))
    
    // Find first agent (SCAN) - agent without any next_agent_id pointing to it
    let firstAgent = agents.find((a) => !agents.some((other) => other.next_agent_id === a.id)) || agents[0]
    
    if (!firstAgent) {
      console.error("[v0] [CREATE-SCAN] No first agent found")
      return NextResponse.json({ error: "No agents available" }, { status: 400 })
    }
    
    console.log("[v0] [CREATE-SCAN] First agent:", firstAgent.name, firstAgent.id)
    
    // Build ordered list of agents following next_agent_id chain
    const orderedAgents = []
    let currentAgent = firstAgent
    const visited = new Set<string>()
    let stepOrder = 1
    
    // Etapa 1: SCAN (primeiro agente - conversacional)
    if (currentAgent) {
      scanSteps.push({
        scan_id: scan.id,
        agent_id: currentAgent.id,
        step_order: stepOrder++,
        step_type: "agent",
        status: "in_progress",
        depends_on_step_ids: [],
        auto_execute: false,
      })
      orderedAgents.push({ agent: currentAgent, stepOrder: scanSteps.length })
      visited.add(currentAgent.id)
    }
    
    // Etapa 2: SCAN Clarity (documento manual - não tem agente)
    // Esta etapa depende da Etapa 1 (SCAN)
    scanSteps.push({
      scan_id: scan.id,
      agent_id: null, // Documento manual não tem agente
      step_order: stepOrder++,
      step_type: "document",
      status: "pending",
      depends_on_step_ids: [], // Será atualizado após criar todas as etapas
      document_template_url: null, // TODO: Adicionar URL do template quando disponível
      manual_document_uploaded: false,
      auto_execute: false,
    })
    
    // Continuar com os outros agentes seguindo next_agent_id
    currentAgent = currentAgent.next_agent_id ? agentMap.get(currentAgent.next_agent_id) : null
    while (currentAgent && !visited.has(currentAgent.id) && stepOrder <= 10) {
      // Determinar tipo de etapa baseado no agente
      // GROOVIA INTELLIGENCE é synthetic, outros autônomos são autonomous
      let stepType = "agent"
      if (currentAgent.is_passive) {
        stepType = currentAgent.name === "GROOVIA INTELLIGENCE" ? "synthetic" : "autonomous"
      }
      
      scanSteps.push({
        scan_id: scan.id,
        agent_id: currentAgent.id,
        step_order: stepOrder++,
        step_type: stepType,
        status: "pending",
        depends_on_step_ids: [], // Será atualizado após criar todas as etapas
        auto_execute: currentAgent.is_passive || false,
      })
      
      orderedAgents.push({ agent: currentAgent, stepOrder: scanSteps.length })
      visited.add(currentAgent.id)
      
      // Move to next agent
      currentAgent = currentAgent.next_agent_id ? agentMap.get(currentAgent.next_agent_id) : null
    }
    
    console.log("[v0] [CREATE-SCAN] Created", scanSteps.length, "scan steps")
    console.log("[v0] [CREATE-SCAN] Step order:", scanSteps.map((s, i) => ({ order: s.step_order, type: s.step_type, agent_id: s.agent_id })))

    if (scanSteps.length > 0) {
      console.log("[v0] [CREATE-SCAN] Creating", scanSteps.length, "scan steps...")
      const { data: createdSteps, error: stepsError } = await supabase
        .from("scan_steps")
        .insert(scanSteps)
        .select()

      if (stepsError) {
        console.error("[v0] [CREATE-SCAN] Error creating scan steps:", stepsError)
        return NextResponse.json({ error: "Failed to create scan steps", details: stepsError.message }, { status: 500 })
      }

      console.log("[v0] [CREATE-SCAN] Created", createdSteps?.length || 0, "scan steps successfully")
      
      // Log scan steps details for debug
      if (createdSteps) {
        createdSteps.forEach((step: any, index: number) => {
          console.log(`[v0] [CREATE-SCAN] Step ${index + 1}:`, {
            id: step.id,
            step_order: step.step_order,
            agent_id: step.agent_id,
            step_type: step.step_type,
            scan_id: step.scan_id
          })
        })
      }

      // Atualizar depends_on_step_ids com os IDs reais das etapas
      // Estrutura de dependências:
      // Etapa 1 (SCAN): sem dependências
      // Etapa 2 (SCAN Clarity - document): depende de 1
      // Etapa 3 (Mercado ICP): depende de 1
      // Etapa 4 (Persona): depende de 1, 2, 3
      // Etapa 5 (Sintetizador): depende de 2
      // Etapa 6 (GROOVIA INTELLIGENCE): depende de 1, 2, 3, 4, 5
      
      if (createdSteps && createdSteps.length > 0) {
        console.log("[v0] [CREATE-SCAN] Configuring dependencies for", createdSteps.length, "steps...")
        
        // Create map of step_order -> step_id for easy lookup
        const stepIdMap = new Map<number, string>()
        createdSteps.forEach((step: any) => {
          stepIdMap.set(step.step_order, step.id)
        })
        
        // Create map by agent name for identification (useful for debugging)
        const stepByAgentName = new Map<string, any>()
        createdSteps.forEach((step: any) => {
          if (step.agent_id) {
            const agent = agentMap.get(step.agent_id)
            if (agent) {
              stepByAgentName.set(agent.name, step)
              console.log(`[v0] [CREATE-SCAN] Step ${step.step_order} (${agent.name}):`, step.id)
            }
          } else if (step.step_type === "document") {
            console.log(`[v0] [CREATE-SCAN] Step ${step.step_order} (SCAN Clarity - document):`, step.id)
          }
        })
        
        // Find step IDs by order (they should be in order 1-6)
        const step1Id = stepIdMap.get(1) // SCAN
        const step2Id = stepIdMap.get(2) // SCAN Clarity (document)
        const step3Id = stepIdMap.get(3) // Mercado ICP (first agent after SCAN)
        const step4Id = stepIdMap.get(4) // Persona (second agent after SCAN)
        const step5Id = stepIdMap.get(5) // Sintetizador (third agent after SCAN)
        const step6Id = stepIdMap.get(6) // GROOVIA INTELLIGENCE (fourth agent after SCAN)
        
        console.log("[v0] [CREATE-SCAN] Step IDs by order:", { 
          step1: step1Id, 
          step2: step2Id, 
          step3: step3Id, 
          step4: step4Id, 
          step5: step5Id, 
          step6: step6Id,
          totalSteps: createdSteps.length
        })
        
        // Validate we have all required steps
        if (!step1Id) {
          console.error("[v0] [CREATE-SCAN] Step 1 (SCAN) not found!")
        }
        if (!step2Id) {
          console.error("[v0] [CREATE-SCAN] Step 2 (SCAN Clarity) not found!")
        }
        if (createdSteps.length < 6) {
          console.warn("[v0] [CREATE-SCAN] Expected 6 steps, but only", createdSteps.length, "were created")
        }
        
        // Configure dependencies based on step order
        // Etapa 2: SCAN Clarity depende da Etapa 1 (SCAN)
        if (step2Id && step1Id) {
          console.log("[v0] [CREATE-SCAN] Configuring: Step 2 (SCAN Clarity) depends on Step 1 (SCAN)")
          const { error: updateError } = await supabase
            .from("scan_steps")
            .update({ depends_on_step_ids: [step1Id] })
            .eq("id", step2Id)
          
          if (updateError) {
            console.error("[v0] [CREATE-SCAN] Error updating step 2 dependencies:", updateError)
          } else {
            console.log("[v0] [CREATE-SCAN] Step 2 dependencies updated successfully")
          }
        }
        
        // Etapa 3: Mercado ICP depende da Etapa 1 (SCAN)
        if (step3Id && step1Id) {
          console.log("[v0] [CREATE-SCAN] Configuring: Step 3 (Mercado ICP) depends on Step 1 (SCAN)")
          const { error: updateError } = await supabase
            .from("scan_steps")
            .update({ depends_on_step_ids: [step1Id] })
            .eq("id", step3Id)
          
          if (updateError) {
            console.error("[v0] [CREATE-SCAN] Error updating step 3 dependencies:", updateError)
          } else {
            console.log("[v0] [CREATE-SCAN] Step 3 dependencies updated successfully")
          }
        }
        
        // Etapa 4: Persona depende das Etapas 1 (SCAN), 2 (SCAN Clarity) e 3 (Mercado ICP)
        if (step4Id && step1Id && step2Id && step3Id) {
          console.log("[v0] [CREATE-SCAN] Configuring: Step 4 (Persona) depends on Steps 1, 2, 3")
          const { error: updateError } = await supabase
            .from("scan_steps")
            .update({ depends_on_step_ids: [step1Id, step2Id, step3Id] })
            .eq("id", step4Id)
          
          if (updateError) {
            console.error("[v0] [CREATE-SCAN] Error updating step 4 dependencies:", updateError)
          } else {
            console.log("[v0] [CREATE-SCAN] Step 4 dependencies updated successfully")
          }
        }
        
        // Etapa 5: Sintetizador depende da Etapa 2 (SCAN Clarity)
        if (step5Id && step2Id) {
          console.log("[v0] [CREATE-SCAN] Configuring: Step 5 (Sintetizador) depends on Step 2 (SCAN Clarity)")
          const { error: updateError } = await supabase
            .from("scan_steps")
            .update({ depends_on_step_ids: [step2Id] })
            .eq("id", step5Id)
          
          if (updateError) {
            console.error("[v0] [CREATE-SCAN] Error updating step 5 dependencies:", updateError)
          } else {
            console.log("[v0] [CREATE-SCAN] Step 5 dependencies updated successfully")
          }
        }
        
        // Etapa 6: GROOVIA INTELLIGENCE depende de todas as etapas anteriores (1, 2, 3, 4, 5)
        if (step6Id && step1Id && step2Id && step3Id && step4Id && step5Id) {
          console.log("[v0] [CREATE-SCAN] Configuring: Step 6 (GROOVIA INTELLIGENCE) depends on all previous steps")
          const { error: updateError } = await supabase
            .from("scan_steps")
            .update({ depends_on_step_ids: [step1Id, step2Id, step3Id, step4Id, step5Id] })
            .eq("id", step6Id)
          
          if (updateError) {
            console.error("[v0] [CREATE-SCAN] Error updating step 6 dependencies:", updateError)
          } else {
            console.log("[v0] [CREATE-SCAN] Step 6 dependencies updated successfully")
          }
        }
        
        // Verify dependencies were set correctly
        const { data: verifySteps } = await supabase
          .from("scan_steps")
          .select("id, step_order, depends_on_step_ids, step_type")
          .eq("scan_id", scan.id)
          .order("step_order")
        
        if (verifySteps) {
          console.log("[v0] [CREATE-SCAN] Verified dependencies:")
          verifySteps.forEach((step: any) => {
            console.log(`[v0] [CREATE-SCAN] Step ${step.step_order} (${step.step_type}): depends on`, step.depends_on_step_ids || [])
          })
        }
        
        console.log("[v0] [CREATE-SCAN] Dependencies configured successfully")
      }
    }

    return NextResponse.json({ scan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in POST /api/scans:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
