import 'server-only'

import Stripe from 'stripe'
import { createAdminClient } from '@/lib/shared/db/admin'
import { getMatchingFeeConfig } from '@/lib/core/matching/fees'
import { runAntiCollusionChecks } from '@/lib/trust/anti-collusion'

type MatchingConfirmResult =
  | { status: 'WAITING_OTHER_PARTY'; message: string }
  | {
      status: 'PAYMENT_REQUIRED' | 'PAYMENT_ALREADY_INITIATED'
      clientSecret: string
      amountCents: number
      mustPay: boolean
      message: string
    }
  | { status: 'ALREADY_CONFIRMED'; message: string }

const CONFIRMABLE_STATUSES = [
  'accepted',
  'paid',
  'matched',
  'confirmed',
  'payment_pending',
]

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw Object.assign(
      new Error('Configuration paiement indisponible. Réessayez plus tard.'),
      { status: 503 }
    )
  }

  return new Stripe(secretKey)
}

export async function confirmMatchingForBooking(
  bookingId: string,
  userId: string
): Promise<MatchingConfirmResult> {
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('is_suspended')
    .eq('id', userId)
    .single()

  if (profile?.is_suspended) {
    throw Object.assign(new Error('Compte suspendu'), { status: 403 })
  }

  const { data: booking } = await admin
    .from('bookings')
    .select(
      'id, sender_id, traveler_id, status, sender_confirmed_at, traveler_confirmed_at, status_history, duration_hours'
    )
    .eq('id', bookingId)
    .single()

  if (!booking) {
    throw Object.assign(new Error('Réservation introuvable'), { status: 404 })
  }

  const isSender = booking.sender_id === userId
  const isTraveler = booking.traveler_id === userId

  if (!isSender && !isTraveler) {
    throw Object.assign(new Error('Accès non autorisé'), { status: 403 })
  }

  if (!CONFIRMABLE_STATUSES.includes(booking.status)) {
    throw Object.assign(new Error('Statut incompatible'), { status: 422 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}
  let confirmationWasAlreadyRecorded = false

  if (isSender && !booking.sender_confirmed_at) {
    updates.sender_confirmed_at = now
  } else if (isTraveler && !booking.traveler_confirmed_at) {
    updates.traveler_confirmed_at = now
  } else {
    confirmationWasAlreadyRecorded = true
  }

  if (Object.keys(updates).length > 0) {
    await admin.from('bookings').update(updates).eq('id', bookingId)
  }

  const { data: updated } = await admin
    .from('bookings')
    .select(
      'sender_confirmed_at, traveler_confirmed_at, sender_id, traveler_id, status_history, duration_hours'
    )
    .eq('id', bookingId)
    .single()

  if (!updated) {
    throw Object.assign(new Error('Réservation introuvable'), { status: 404 })
  }

  const bothConfirmed =
    updated.sender_confirmed_at !== null &&
    updated.traveler_confirmed_at !== null

  if (!bothConfirmed) {
    return {
      status: confirmationWasAlreadyRecorded
        ? 'ALREADY_CONFIRMED'
        : 'WAITING_OTHER_PARTY',
      message: confirmationWasAlreadyRecorded
        ? 'Votre confirmation est déjà enregistrée.'
        : "Votre confirmation est enregistrée. L'autre partie doit encore confirmer.",
    }
  }

  const { data: existingPayment } = await admin
    .from('matching_payments')
    .select('id, status, stripe_client_secret, amount_cents, paid_by')
    .eq('booking_id', bookingId)
    .in('status', ['pending', 'succeeded'])
    .maybeSingle()

  if (existingPayment) {
    if (existingPayment.status === 'succeeded') {
      await admin
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId)
        .in('status', ['payment_pending', 'accepted'])

      return {
        status: 'ALREADY_CONFIRMED',
        message: 'La mise en relation est déjà confirmée.',
      }
    }

    return {
      status: 'PAYMENT_ALREADY_INITIATED',
      clientSecret: existingPayment.stripe_client_secret,
      amountCents: existingPayment.amount_cents,
      mustPay: userId === existingPayment.paid_by,
      message: 'Un paiement de mise en relation est déjà en cours.',
    }
  }

  const { amountCents, currency } = getMatchingFeeConfig()

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: amountCents,
    currency,
    description: 'Frais de mise en relation Sendbox',
    metadata: {
      booking_id: bookingId,
      sender_id: updated.sender_id,
      traveler_id: updated.traveler_id,
      type: 'matching_fee',
    },
  })

  if (!paymentIntent.client_secret) {
    throw Object.assign(
      new Error('Impossible de préparer le paiement de mise en relation.'),
      { status: 502 }
    )
  }

  await admin.from('matching_payments').insert({
    booking_id: bookingId,
    stripe_payment_intent_id: paymentIntent.id,
    stripe_client_secret: paymentIntent.client_secret,
    amount_cents: paymentIntent.amount,
    currency: paymentIntent.currency,
    paid_by: updated.sender_id,
  })

  const history = Array.isArray(updated.status_history)
    ? updated.status_history
    : []

  await admin
    .from('bookings')
    .update({
      status: 'payment_pending',
      status_history: [
        ...history,
        { status: 'payment_pending', actor_id: userId, timestamp: now },
      ],
    })
    .eq('id', bookingId)

  void runAntiCollusionChecks(
    bookingId,
    updated.traveler_id,
    updated.duration_hours ?? 0
  )

  return {
    status: 'PAYMENT_REQUIRED',
    clientSecret: paymentIntent.client_secret,
    amountCents: paymentIntent.amount,
    mustPay: userId === updated.sender_id,
    message: 'Paiement de mise en relation requis.',
  }
}
