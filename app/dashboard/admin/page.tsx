"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Users, Bot, Activity, TrendingUp, DollarSign, ArrowUpRight, Clock } from "lucide-react"

interface Stats {
  totalOrganizations: number
  totalUsers: number
  totalAgents: number
  totalSessions: number
  activeSubscriptions: number
  monthlyRevenue: number
  growthRate: number
}

interface ActivityItem {
  type: string
  title: string
  description: string
  color: string
  timestamp: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log("[v0] Checking admin authentication...")
      const sessionData = localStorage.getItem("groovia_admin_session")

      if (!sessionData) {
        console.log("[v0] No session found, redirecting to login")
        router.push("/admin/login")
        return
      }

      const session = JSON.parse(sessionData)
      console.log("[v0] Admin authenticated:", session.username)
      setAdminUser(session)

      await fetchStats()
      await fetchActivity()

      setLoading(false)
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      router.push("/admin/login")
    }
  }

  const fetchStats = async () => {
    try {
      console.log("[v0] Fetching real stats from database...")
      const response = await fetch("/api/admin/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      console.log("[v0] Stats loaded:", data)
      setStats(data)
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
      setError("Erro ao carregar estatísticas")
    }
  }

  const fetchActivity = async () => {
    try {
      console.log("[v0] Fetching real activity from database...")
      const response = await fetch("/api/admin/activity")
      if (!response.ok) throw new Error("Failed to fetch activity")
      const data = await response.json()
      console.log("[v0] Activity loaded:", data)
      setActivities(data.activities)
    } catch (error) {
      console.error("[v0] Error fetching activity:", error)
    }
  }

  const handleLogout = () => {
    console.log("[v0] Logging out admin user")
    localStorage.removeItem("groovia_admin_session")
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro ao Carregar Dados</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total de Organizações",
      value: stats?.totalOrganizations.toLocaleString() || "0",
      description: `+${stats?.growthRate.toFixed(1)}% este mês`,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total de Usuários",
      value: stats?.totalUsers.toLocaleString() || "0",
      description: "Usuários ativos",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total de Agentes",
      value: stats?.totalAgents.toLocaleString() || "0",
      description: "Agentes criados",
      icon: Bot,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Sessões (Este Mês)",
      value: stats?.totalSessions.toLocaleString() || "0",
      description: "Sessões ativas",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Assinaturas Ativas",
      value: stats?.activeSubscriptions.toLocaleString() || "0",
      description: "Planos pagos",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Receita Mensal",
      value: `$${stats?.monthlyRevenue.toLocaleString() || "0"}`,
      description: "MRR (Monthly Recurring Revenue)",
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ]

  const quickActions = [
    {
      label: "Gerenciar Usuários",
      href: "/admin/usuarios",
      icon: Users,
      description: "Visualizar e gerenciar todos os usuários",
    },
    {
      label: "Gerenciar Organizações",
      href: "/admin/organizacoes",
      icon: Building2,
      description: "Administrar organizações e planos",
    },
    {
      label: "Gerenciar Agentes",
      href: "/admin/agentes",
      icon: Bot,
      description: "Criar e configurar agentes IA",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-purple-600 mb-2">Painel Administrativo</h1>
              <p className="text-slate-600">Visão geral da plataforma e métricas de negócio</p>
            </div>
            <Button onClick={handleLogout} variant="outline" size="lg">
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-all duration-200 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-slate-700">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                    {stat.description.includes("+") && <ArrowUpRight className="h-3 w-3 text-green-600" />}
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Ações Rápidas</CardTitle>
              <CardDescription>Gerenciar recursos da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.href}
                    variant="outline"
                    className="w-full justify-start h-auto py-4 hover:bg-purple-50 hover:border-purple-200 transition-colors bg-transparent"
                    onClick={() => router.push(action.href)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{action.label}</div>
                        <div className="text-xs text-slate-500 mt-1">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl">Atividade Recente</CardTitle>
              <CardDescription>Últimas ações na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  activities.slice(0, 6).map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          activity.color === "green"
                            ? "bg-green-500"
                            : activity.color === "purple"
                              ? "bg-purple-500"
                              : activity.color === "blue"
                                ? "bg-blue-500"
                                : "bg-slate-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
