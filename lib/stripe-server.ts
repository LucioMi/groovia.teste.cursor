import "server-only"
import Stripe from "stripe"

// Lazy initialization para evitar erros durante o build
let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe {
  if (stripeInstance) {
    return stripeInstance
  }
  
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  
  // Verificar se a chave não é uma chave dummy de build
  if (secretKey.includes("dummy") || secretKey === "sk_test_dummy_key_for_build_only") {
    throw new Error("STRIPE_SECRET_KEY is not properly configured")
  }
  
  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
  })
  return stripeInstance
}

// Export para compatibilidade com código existente
// Só será inicializado quando usado (não durante build)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripeInstance()
    const value = (instance as any)[prop]
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
})
