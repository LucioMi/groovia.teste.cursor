"use client"

import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type SubscriptionPlan, formatPrice } from "@/lib/products"

interface PricingCardProps {
  plan: SubscriptionPlan
  currentPlanId?: string
  onSelectPlan: (planId: string) => void
  isLoading?: boolean
}

export function PricingCard({ plan, currentPlanId, onSelectPlan, isLoading }: PricingCardProps) {
  const isCurrentPlan = currentPlanId === plan.id
  const isFree = plan.priceInCents === 0

  return (
    <Card className={plan.isPopular ? "border-primary shadow-lg" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          {plan.isPopular && <Badge variant="default">Popular</Badge>}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{formatPrice(plan.priceInCents)}</span>
            {!isFree && <span className="text-muted-foreground">/{plan.interval}</span>}
          </div>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? "outline" : "default"}
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelectPlan(plan.id)}
        >
          {isCurrentPlan ? "Current Plan" : isFree ? "Get Started" : "Upgrade"}
        </Button>
      </CardFooter>
    </Card>
  )
}
