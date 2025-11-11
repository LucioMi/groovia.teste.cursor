import { NextResponse } from "next/server"
import { isOpenAIConfigured } from "@/lib/openai-assistant"

// GET - Check OpenAI configuration status
export async function GET() {
  try {
    const configured = isOpenAIConfigured()

    console.log("[v0] OpenAI configuration status:", configured)

    return NextResponse.json({
      configured,
      message: configured
        ? "OpenAI API key está configurada corretamente"
        : "OpenAI API key não encontrada. Adicione OPENAI_API_KEY nas variáveis de ambiente.",
    })
  } catch (error: any) {
    console.error("[v0] Error checking OpenAI status:", error)
    return NextResponse.json(
      {
        configured: false,
        error: error.message || "Erro ao verificar configuração do OpenAI",
      },
      { status: 500 },
    )
  }
}
