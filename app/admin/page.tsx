"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Bot, MessageSquare, Loader2 } from "lucide-react"
import Link from "next/link"

interface DashboardStats {
  totalOrganizations: number
  totalUsers: number
  totalAgents: number
  activeAgents: number
  totalConversations: number
  monthlyGrowth: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "organizations" | "subscriptions">("overview")

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) throw new Error("Erro ao carregar estatísticas")
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("[v0] Error loading stats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Painel Administrativo
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Visão geral do sistema GrooveIA</p>
      </div>

      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Organizações</CardTitle>
            <Building2 className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalOrganizations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats?.monthlyGrowth || 0}% este mês</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Usuários Totais</CardTitle>
            <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários únicos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Agentes Ativos</CardTitle>
            <Bot className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.activeAgents || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">IA assistentes configurados</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Sessões (Mês)</CardTitle>
            <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-foreground">{stats?.totalConversations || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Conversas iniciadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg font-semibold text-foreground">Receita Mensal</CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">
              MRR (Monthly Recurring Revenue)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-lg md:text-xl text-green-600 font-medium">$</span>
              <span className="text-3xl md:text-4xl font-bold text-foreground">$0,00</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">0 assinaturas ativas</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg font-semibold text-foreground">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">Gerenciar sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="block p-3 md:p-3.5 rounded-md border border-border hover:bg-accent transition-colors text-sm md:text-base font-medium text-foreground"
              >
                Ver todos os usuários
              </Link>
              <Link
                href="/admin/organizations"
                className="block p-3 md:p-3.5 rounded-md border border-border hover:bg-accent transition-colors text-sm md:text-base font-medium text-foreground"
              >
                Gerenciar organizações
              </Link>
              <Link
                href="/admin/agents"
                className="block p-3 md:p-3.5 rounded-md border border-border hover:bg-accent transition-colors text-sm md:text-base font-medium text-foreground"
              >
                Visualizar logs
              </Link>
              <Link
                href="/admin/settings"
                className="block p-3 md:p-3.5 rounded-md border border-border hover:bg-accent transition-colors text-sm md:text-base font-medium text-foreground"
              >
                Configurações do sistema
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="flex gap-6 md:gap-8 min-w-max px-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm md:text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === "overview"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 text-sm md:text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === "users"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setActiveTab("organizations")}
            className={`pb-3 text-sm md:text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === "organizations"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Organizações
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-3 text-sm md:text-base font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === "subscriptions"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Assinaturas
          </button>
        </div>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg font-semibold text-foreground">Atividade Recente</CardTitle>
          <CardDescription className="text-xs md:text-sm text-muted-foreground">
            Últimas ações no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 md:py-12">
            <p className="text-sm md:text-base text-muted-foreground">Logs de atividade serão exibidos aqui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
