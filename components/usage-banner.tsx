"use client"

import { useEffect, useState } from "react"
import { AlertCircle, TrendingUp } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

interface UsageLimits {
  canCreateSession: boolean
  canCreateWebhook: boolean
  currentSessions: number
  currentWebhooks: number
  limits: {
    maxSessionsPerMonth: number
    maxWebhooks: number
  }
}

export function UsageBanner() {
  const [usage, setUsage] = useState<UsageLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage")
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !usage) return null

  const sessionUsagePercent =
    usage.limits.maxSessionsPerMonth === -1 ? 0 : (usage.currentSessions / usage.limits.maxSessionsPerMonth) * 100

  const webhookUsagePercent =
    usage.limits.maxWebhooks === -1 ? 0 : (usage.currentWebhooks / usage.limits.maxWebhooks) * 100

  const isNearLimit = sessionUsagePercent > 80 || webhookUsagePercent > 80
  const isAtLimit = !usage.canCreateSession || !usage.canCreateWebhook

  if (!isNearLimit && !isAtLimit) return null

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{isAtLimit ? "Limite de uso atingido" : "Próximo do limite"}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {isAtLimit
            ? "Você atingiu o limite do seu plano. Faça upgrade para continuar."
            : "Você está próximo do limite do seu plano."}
        </p>

        <div className="space-y-2">
          {usage.limits.maxSessionsPerMonth !== -1 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Sessões (este mês)</span>
                <span>
                  {usage.currentSessions} / {usage.limits.maxSessionsPerMonth}
                </span>
              </div>
              <Progress value={sessionUsagePercent} />
            </div>
          )}

          {usage.limits.maxWebhooks !== -1 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Webhooks</span>
                <span>
                  {usage.currentWebhooks} / {usage.limits.maxWebhooks}
                </span>
              </div>
              <Progress value={webhookUsagePercent} />
            </div>
          )}
        </div>

        <Button asChild size="sm" className="mt-2">
          <Link href="/dashboard/billing">
            <TrendingUp className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
