"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink, X, Rocket, CheckCircle2 } from "lucide-react"

export function DeployGuideBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className="relative rounded-xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-6 shadow-2xl shadow-purple-500/50 border border-purple-400/20">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Pronto para Produção! 🚀</h3>
            <p className="text-sm text-purple-100">
              Seu código está correto. Deploy agora para usar com dados reais do OpenAI.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-green-300" />
            <span>Integração OpenAI implementada</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-green-300" />
            <span>Vector stores e prompts prontos</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <CheckCircle2 className="w-4 h-4 text-green-300" />
            <span>Autenticação configurada</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => window.open("https://vercel.com/new", "_blank")}
            className="flex-1 bg-white text-purple-700 hover:bg-purple-50 font-semibold"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy no Vercel
          </Button>
          <Button
            onClick={() => window.open("/COMO_USAR_EM_PRODUCAO.md", "_blank")}
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-purple-200 mt-3 text-center">Deploy leva ~2 minutos • Grátis para começar</p>
      </div>
    </div>
  )
}
