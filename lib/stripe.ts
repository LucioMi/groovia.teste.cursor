import "server-only"

// Stripe é opcional - esta função retorna null se não configurado
let StripeModule: typeof import("stripe") | null = null
let stripeInstance: any = null

function isStripeConfigured(): boolean {
  const secretKey = process.env.STRIPE_SECRET_KEY
  return !!secretKey && !secretKey.includes("dummy") && secretKey !== "sk_test_dummy_key_for_build_only"
}

function getStripeInstance() {
  if (stripeInstance) {
    return stripeInstance
  }
  
  if (!isStripeConfigured()) {
    return null
  }
  
  const Stripe = require("stripe").default
  const secretKey = process.env.STRIPE_SECRET_KEY!
  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  })
  return stripeInstance
}

// Helper function para obter o Stripe de forma segura
// Retorna null se não configurado (Stripe é opcional)
export function getStripe() {
  // Durante build, retorna null
  if (typeof window === "undefined" && process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  
  return getStripeInstance()
}

// Helper para verificar se Stripe está disponível
export function isStripeAvailable(): boolean {
  return isStripeConfigured()
}
