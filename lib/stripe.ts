import "server-only"

import Stripe from "stripe"

// Lazy initialization para evitar erros durante o build
let stripeInstance: Stripe | null = null

function initializeStripe(): Stripe {
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

// Helper function para obter o Stripe de forma segura
// Esta função só é chamada em runtime (não durante build)
export function getStripe(): Stripe {
  return initializeStripe()
}
