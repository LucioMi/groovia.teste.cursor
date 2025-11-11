export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  priceInCents: number
  priceId?: string
  interval: "month" | "year"
  features: string[]
  maxSessions: number
  maxWebhooks: number
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Para começar",
    priceInCents: 0,
    interval: "month",
    features: ["Agentes globais ilimitados", "100 sessões/mês", "10 webhooks", "Suporte por email"],
    maxSessions: 100,
    maxWebhooks: 10,
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para pequenas equipes",
    priceInCents: 2900,
    interval: "month",
    features: ["Agentes globais ilimitados", "1.000 sessões/mês", "50 webhooks", "Suporte prioritário"],
    maxSessions: 1000,
    maxWebhooks: 50,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para empresas em crescimento",
    priceInCents: 9900,
    interval: "month",
    features: [
      "Agentes globais ilimitados",
      "10.000 sessões/mês",
      "200 webhooks",
      "Suporte 24/7",
      "Análises avançadas",
    ],
    maxSessions: 10000,
    maxWebhooks: 200,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Para grandes empresas",
    priceInCents: 0,
    interval: "month",
    features: [
      "Agentes globais ilimitados",
      "Sessões ilimitadas",
      "Webhooks ilimitados",
      "Suporte dedicado",
      "SLA garantido",
    ],
    maxSessions: -1,
    maxWebhooks: -1,
  },
]
