"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, CreditCard, TrendingUp, Loader2, AlertCircle } from "lucide-react"

interface Subscription {
  id: string
  organization_id: string
  organization_name: string | null
  organization_slug: string | null
  plan_name: string | null
  price_in_cents: number
  status: string
  stripe_subscription_id: string | null
  current_period_start: string
  current_period_end: string
  created_at: string
}

interface Payment {
  id: string
  organization_id: string
  organization_name: string | null
  amount_in_cents: number
  currency: string
  status: string
  description: string | null
  stripe_payment_intent_id: string | null
  created_at: string
}

export default function AdminPaymentsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [subsResponse, paymentsResponse] = await Promise.all([
        fetch("/api/admin/subscriptions"),
        fetch("/api/admin/payments"),
      ])

      if (!subsResponse.ok || !paymentsResponse.ok) {
        throw new Error("Erro ao carregar dados")
      }

      const subsData = await subsResponse.json()
      const paymentsData = await paymentsResponse.json()

      setSubscriptions(subsData.subscriptions || [])
      setPayments(paymentsData.payments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (cents: number, currency = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
    }).format(cents / 100)
  }

  const calculateMRR = () => {
    return subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.price_in_cents, 0)
  }

  const calculateTotalRevenue = () => {
    return payments.filter((p) => p.status === "succeeded").reduce((sum, p) => sum + p.amount_in_cents, 0)
  }

  const getRevenueThisMonth = () => {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return payments
      .filter((p) => {
        const paymentDate = new Date(p.created_at)
        return p.status === "succeeded" && paymentDate >= firstDayOfMonth
      })
      .reduce((sum, p) => sum + p.amount_in_cents, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Pagamentos e Vendas</h2>
          <p className="text-muted-foreground">Visualizar assinaturas, pagamentos e receitas</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateMRR())}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions.filter((s) => s.status === "active").length} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(calculateTotalRevenue())}</div>
            <p className="text-xs text-muted-foreground">
              {payments.filter((p) => p.status === "succeeded").length} pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getRevenueThisMonth())}</div>
            <p className="text-xs text-muted-foreground">Receita do mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assinaturas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">
              {subscriptions.filter((s) => s.status === "active").length} ativas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas ({subscriptions.length})</CardTitle>
              <CardDescription>Todas as assinaturas do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organização</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Stripe ID</TableHead>
                      <TableHead>Criada em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.organization_name || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sub.plan_name || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(sub.price_in_cents)}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(sub.current_period_start).toLocaleDateString("pt-BR")} -{" "}
                          {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {sub.stripe_subscription_id ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {sub.stripe_subscription_id.substring(0, 20)}...
                            </code>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{new Date(sub.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos ({payments.length})</CardTitle>
              <CardDescription>Histórico de todos os pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organização</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Stripe ID</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.organization_name || "N/A"}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payment.amount_in_cents, payment.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === "succeeded"
                                ? "default"
                                : payment.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{payment.description || "-"}</TableCell>
                        <TableCell>
                          {payment.stripe_payment_intent_id ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {payment.stripe_payment_intent_id.substring(0, 20)}...
                            </code>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
