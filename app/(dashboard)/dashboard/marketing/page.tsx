"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SuporteGroovia from "@/components/suporte-groovia"
import { useState } from "react"

export default function MarketingPage() {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Marketing</h1>
          <p className="mt-2 text-muted-foreground">Estratégias e automações de marketing inteligente</p>
        </div>
        <Button onClick={() => setSupportOpen(true)} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          Suporte Groovia
        </Button>
      </div>

      {/* Coming Soon Content */}
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-2xl p-12 text-center">
          {/* Lock Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#7C3AED] to-[#10B981] p-6">
              <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-3xl font-bold text-foreground">Em Breve: Marketing Inteligente</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Estamos preparando ferramentas poderosas de marketing com IA para você. Em breve você terá acesso a:
          </p>

          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#10B981]" />
              <p className="text-muted-foreground">Criação automática de campanhas de marketing</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#10B981]" />
              <p className="text-muted-foreground">Geração de conteúdo para redes sociais</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#10B981]" />
              <p className="text-muted-foreground">Análise de performance e otimização</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-[#10B981]" />
              <p className="text-muted-foreground">Automação de email marketing e nutrição de leads</p>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-[#7C3AED]/10 p-4">
            <p className="text-sm text-[#7C3AED] font-medium">
              💡 Novidade em desenvolvimento - Fique atento às atualizações!
            </p>
          </div>
        </Card>
      </div>

      {/* Support Panel */}
      <SuporteGroovia isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  )
}
