"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Checkout from "@/components/checkout"
import { createCustomerPortalSession, getCheckoutSessionStatus } from "@/app/actions/stripe"
import { SUBSCRIPTION_PLANS } from "@/lib/plans"

function BillingContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (sessionId) {
      checkSessionStatus(sessionId)
    }
    fetchSubscription()
  }, [sessionId])

  const checkSessionStatus = async (sessionId: string) => {
    const status = await getCheckoutSessionStatus(sessionId)
    if (status?.status === "complete") {
      // Refresh subscription data
      setTimeout(() => fetchSubscription(), 2000)
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/user/subscription")
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error("[v0] Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const portalUrl = await createCustomerPortalSession()
      window.location.href = portalUrl
    } catch (error) {
      console.error("[v0] Error opening portal:", error)
      setPortalLoading(false)
    }
  }

  if (selectedPlan) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
          <p className="text-muted-foreground mt-2">Complete seu pagamento para ativar o plano</p>
        </div>
        <div className="max-w-3xl">
          <Checkout planId={selectedPlan} organizationId="current" />
          <Button variant="ghost" className="mt-4" onClick={() => setSelectedPlan(null)}>
            Voltar para planos
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assinatura e Cobrança</h1>
        <p className="text-muted-foreground mt-2">Gerencie seu plano e informações de pagamento</p>
      </div>

      {subscription && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Sua assinatura ativa</CardDescription>
              </div>
              <Button onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading ? "Carregando..." : "Gerenciar Assinatura"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">{subscription.plan_type || "Free"}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscription.current_period_end && (
                    <>Renova em {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>
              <Badge variant={subscription.plan_status === "active" ? "default" : "secondary"}>
                {subscription.plan_status === "active" ? "Ativo" : subscription.plan_status || "Free"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Planos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card key={plan.id} className={subscription?.plan_type === plan.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${(plan.priceInCents / 100).toFixed(2)}</span>
                  <span className="text-muted-foreground">/{plan.interval === "month" ? "mês" : "ano"}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={subscription?.plan_type === plan.id ? "outline" : "default"}
                  disabled={subscription?.plan_type === plan.id || plan.priceInCents === 0}
                  onClick={() => plan.priceInCents > 0 && setSelectedPlan(plan.id)}
                >
                  {subscription?.plan_type === plan.id
                    ? "Plano Atual"
                    : plan.priceInCents === 0
                      ? "Plano Gratuito"
                      : "Selecionar Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
