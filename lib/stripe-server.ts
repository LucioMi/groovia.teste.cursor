import "server-only"

// Stripe é opcional - este módulo NUNCA importa Stripe durante o build
// Apenas verifica variáveis de ambiente sem executar código do Stripe

function isStripeConfigured(): boolean {
  // Verificação pura de env vars - nunca executa código do Stripe
  try {
    if (typeof process === "undefined" || !process.env) {
      return false
    }
    const secretKey = process.env.STRIPE_SECRET_KEY
    return !!secretKey && !secretKey.includes("dummy") && secretKey !== "sk_test_dummy_key_for_build_only"
  } catch {
    return false
  }
}

// Lazy initialization - só carrega Stripe em runtime quando necessário
let stripeInstance: any = null

function getStripeInstance() {
  // Durante build, nunca inicializa
  if (typeof process !== "undefined" && process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  
  if (stripeInstance) {
    return stripeInstance
  }
  
  if (!isStripeConfigured()) {
    return null
  }
  
  try {
    // Dynamic require - só executa em runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Stripe = require("stripe").default
    const secretKey = process.env.STRIPE_SECRET_KEY!
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2024-12-18.acacia",
    })
    return stripeInstance
  } catch (error) {
    console.error("Failed to initialize Stripe:", error)
    return null
  }
}

// Helper para criar Proxy recursivo para objetos aninhados (stripe.customers.create, etc)
function createStripeProxy(): any {
  return new Proxy({} as any, {
    get(_target, prop) {
      // Se não configurado, lança erro claro
      if (!isStripeConfigured()) {
        // Retorna proxy aninhado que também lança erro
        return createStripeProxy()
      }
      
      const instance = getStripeInstance()
      
      if (!instance) {
        throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable to use this feature.")
      }
      
      const value = instance[prop]
      
      // Se é função, retorna função bound
      if (typeof value === "function") {
        return value.bind(instance)
      }
      
      // Se é objeto, retorna proxy recursivo para acesso aninhado
      if (value && typeof value === "object") {
        return new Proxy(value, {
          get(target, nestedProp) {
            const nestedValue = target[nestedProp]
            if (typeof nestedValue === "function") {
              return nestedValue.bind(target)
            }
            return nestedValue
          },
        })
      }
      
      return value
    },
  })
}

// Export stripe - só inicializa quando acessado (lazy)
// Nunca executa durante build
export const stripe = createStripeProxy()

// Helper para verificar se Stripe está disponível (nunca executa código do Stripe)
export function isStripeAvailable(): boolean {
  return isStripeConfigured()
}
