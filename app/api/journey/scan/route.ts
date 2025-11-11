import { NextResponse } from "next/server"

const MOCK_JOURNEY_STEPS = [
  {
    id: "scan-1",
    step: 1,
    title: "SCAN",
    description: "Conduz uma entrevista guiada para revelar o DNA da sua empresa.",
    agentId: "scan-agent",
    completed: false,
    locked: false,
  },
  {
    id: "scan-2",
    step: 2,
    title: "SCAN Clarity",
    description: "Preencha com sua equipe de liderança esse decodificador do seu negócio",
    agentId: "scan-clarity-agent",
    completed: false,
    locked: true,
  },
  {
    id: "scan-3",
    step: 3,
    title: "Mercado ICP",
    description: "Mergulha no mercado e identifica o público ideal para o seu crescimento.",
    agentId: "market-research-agent",
    completed: false,
    locked: true,
  },
  {
    id: "scan-4",
    step: 4,
    title: "Persona",
    description: "Dá vida ao seu público, revelando quem realmente compra e por quê.",
    agentId: "persona-agent",
    completed: false,
    locked: true,
  },
  {
    id: "scan-5",
    step: 5,
    title: "Sintetizador",
    description: "Transforma respostas e dados brutos em diretrizes claras de ação.",
    agentId: "synthesizer-agent",
    completed: false,
    locked: true,
  },
  {
    id: "scan-6",
    step: 6,
    title: "GROOVIA INTELLIGENCE",
    description: "Compila todas as informações estratégicas em um dossiê inteligente e coerente.",
    agentId: "intelligence-agent",
    completed: false,
    locked: true,
  },
]

export async function GET() {
  console.log("[v0] Journey API GET called")
  return NextResponse.json({ steps: MOCK_JOURNEY_STEPS })
}

export async function POST(request: Request) {
  console.log("[v0] Journey API POST called")
  const { stepId } = await request.json()
  console.log("[v0] Marking step as completed:", stepId)
  return NextResponse.json({ success: true, preview: true })
}
