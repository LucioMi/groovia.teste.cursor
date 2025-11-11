import "server-only"
import Stripe from "stripe"

// Inicializa o Stripe apenas se a chave estiver disponível
// Durante o build, usa uma chave dummy para evitar erros
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : new Stripe("sk_test_dummy_key_for_build_only")
