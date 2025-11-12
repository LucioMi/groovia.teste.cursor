import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import type Stripe from "stripe"

// Lazy import para evitar execução durante build
async function getStripe() {
  const { getStripe: getStripeClient } = await import("@/lib/stripe")
  return getStripeClient()
}

async function updateOrganizationSubscription(organizationId: string, data: any) {
  const { updateOrganizationSubscription: updateSub } = await import("@/lib/subscriptions")
  return updateSub(organizationId, data)
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  // Verificar se Stripe está configurado
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    )
  }

  const stripe = await getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organizationId
        const planId = session.metadata?.planId

        if (!organizationId || !planId) {
          console.error("Missing metadata in checkout session")
          break
        }

        // Get the subscription
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        // Update or create organization subscription
        await updateOrganizationSubscription(organizationId, {
          planId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          status: "active",
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organizationId

        if (!organizationId) {
          console.error("Missing organizationId in subscription metadata")
          break
        }

        await updateOrganizationSubscription(organizationId, {
          status: subscription.status as any,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        })

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organizationId

        if (!organizationId) {
          console.error("Missing organizationId in subscription metadata")
          break
        }

        // Downgrade to free plan
        await updateOrganizationSubscription(organizationId, {
          planId: "free",
          status: "canceled",
          stripeSubscriptionId: null,
        })

        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        // Log successful payment
        console.log("Payment succeeded:", invoice.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const organizationId = subscription.metadata?.organizationId

        if (organizationId) {
          await updateOrganizationSubscription(organizationId, {
            status: "past_due",
          })
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Error processing webhook:", err)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
