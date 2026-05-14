import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/shared/db/admin'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY manquante')
  }

  return new Stripe(secretKey)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Configuration webhook invalide' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    const { data: payment } = await admin
      .from('matching_payments')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .select('booking_id')
      .single()

    if (!payment) {
      return NextResponse.json({ ok: true })
    }

    await admin
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', payment.booking_id)
      .eq('status', 'payment_pending')
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    await admin
      .from('matching_payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id)
  }

  return NextResponse.json({ ok: true })
}
