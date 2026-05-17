import Stripe from 'stripe'

export function createE2EStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Missing STRIPE_SECRET_KEY for E2E')
  return new Stripe(key)
}

export async function approveVerificationSession(
  stripe: Stripe,
  sessionId: string
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (stripe.testHelpers as any).identity.verificationSessions.approve(
    sessionId
  )
}

export async function simulateSubscriptionWebhook(
  stripe: Stripe,
  userId: string
): Promise<void> {
  const customer = await stripe.customers.create({
    metadata: { user_id: userId },
  })

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID!
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 3600,
  })

  const payload = JSON.stringify({
    type: 'customer.subscription.created',
    data: {
      object: {
        ...subscription,
        metadata: { user_id: userId },
      },
    },
  })

  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const sig = stripe.webhooks.generateTestHeaderString({ payload, secret })

  await fetch('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body: payload,
    headers: {
      'stripe-signature': sig,
      'content-type': 'application/json',
    },
  })
}
