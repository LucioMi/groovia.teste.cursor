"use server"

import { stripe } from "@/lib/stripe-server"
import { SUBSCRIPTION_PLANS } from "@/lib/plans"
import { sql } from "@/lib/db"
import { getServerSession } from "@/lib/auth-server"

export async function startCheckoutSession(planId: string) {
  const session = await getServerSession()
  if (!session || !session.organization) {
    throw new Error("Unauthorized")
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) {
    throw new Error(`Plan with id "${planId}" not found`)
  }

  if (plan.priceInCents === 0) {
    throw new Error("Cannot create checkout session for free plan")
  }

  // Get or create Stripe customer
  const orgResult = await sql`
    SELECT customer_id FROM organizations WHERE id = ${session.organization.id}
  `

  let customerId = orgResult[0]?.customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: {
        organizationId: session.organization.id,
        userId: session.user.id,
      },
    })
    customerId = customer.id

    await sql`
      UPDATE organizations 
      SET customer_id = ${customerId}
      WHERE id = ${session.organization.id}
    `
  }

  // Create Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: "embedded",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      organizationId: session.organization.id,
      planId,
    },
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
  })

  return checkoutSession.client_secret
}

export async function createCustomerPortalSession() {
  const session = await getServerSession()
  if (!session || !session.organization) {
    throw new Error("Unauthorized")
  }

  const orgResult = await sql`
    SELECT customer_id FROM organizations WHERE id = ${session.organization.id}
  `

  const customerId = orgResult[0]?.customer_id
  if (!customerId) {
    throw new Error("No Stripe customer found")
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
  })

  return portalSession.url
}

export async function getCheckoutSessionStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      status: session.status,
      customerEmail: session.customer_details?.email,
    }
  } catch (error) {
    console.error("[v0] Error retrieving session:", error)
    return null
  }
}
