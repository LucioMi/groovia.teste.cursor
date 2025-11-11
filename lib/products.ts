export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  interval: "month" | "year"
  features: string[]
  maxSessionsPerMonth: number
  maxWebhooks: number
  isPopular?: boolean
}

// This is the source of truth for all subscription plans
// All UI to display plans should pull from this array
// IDs passed to the checkout session should match IDs from this array
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    priceInCents: 0,
    interval: "month",
    features: ["Agentes globais ilimitados", "100 sessions/month", "Basic webhooks", "Community support"],
    maxSessionsPerMonth: 100,
    maxWebhooks: 3,
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small teams and projects",
    priceInCents: 2900,
    interval: "month",
    features: [
      "Agentes globais ilimitados",
      "1,000 sessions/month",
      "Advanced webhooks",
      "Email support",
      "Custom branding",
    ],
    maxSessionsPerMonth: 1000,
    maxWebhooks: 10,
    isPopular: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing businesses",
    priceInCents: 9900,
    interval: "month",
    features: [
      "Agentes globais ilimitados",
      "10,000 sessions/month",
      "Unlimited webhooks",
      "Priority support",
      "Custom branding",
      "Advanced analytics",
    ],
    maxSessionsPerMonth: 10000,
    maxWebhooks: -1,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    priceInCents: 29900,
    interval: "month",
    features: [
      "Agentes globais ilimitados",
      "Unlimited sessions",
      "Unlimited webhooks",
      "24/7 support",
      "Custom branding",
      "Advanced analytics",
      "SLA guarantee",
      "Dedicated account manager",
    ],
    maxSessionsPerMonth: -1,
    maxWebhooks: -1,
  },
]

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId)
}

export function formatPrice(priceInCents: number): string {
  if (priceInCents === 0) return "Free"
  return `$${(priceInCents / 100).toFixed(0)}`
}
