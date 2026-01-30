/**
 * Stripe Connect transfers (release funds to traveler).
 */

'use server'

import { createAdminClient } from '@/lib/shared/db/admin'
import { stripe } from '@/lib/shared/services/stripe/config'
import { toStripeAmount } from '@/lib/core/payments/calculations'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { getPaymentsMode } from '@/lib/shared/config/features'

const EUR = 'eur'

function normalizeTransferStatus(status: string | null | undefined) {
  switch (status) {
    case 'paid':
    case 'failed':
    case 'reversed':
    case 'pending':
      return status
    default:
      return 'pending'
  }
}

export type ReleaseReason = 'delivery_confirmed' | 'auto_release'

export interface ReleaseTransferResult {
  success?: boolean
  skipped?: boolean
  alreadyTransferred?: boolean
  transferId?: string
  status?: string
  error?: string
}

export async function releaseTransferForBooking(
  bookingId: string,
  reason: ReleaseReason
): Promise<ReleaseTransferResult> {
  if (getPaymentsMode() !== 'stripe') {
    return { skipped: true, error: 'payments_disabled' }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'stripe_not_configured' }
  }

  const admin = createAdminClient()

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(
      'id, sender_id, traveler_id, status, delivery_confirmed_at, paid_at, total_price, commission_amount, insurance_premium, dispute_opened_at'
    )
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return { error: 'booking_not_found' }
  }

  if (booking.status === 'disputed' || booking.dispute_opened_at) {
    return { error: 'dispute_open' }
  }

  const { data: dispute } = await (admin as any)
    .from('disputes')
    .select('status')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (dispute?.status === 'open') {
    return { error: 'dispute_open' }
  }

  const { data: existingTransfer } = await (admin as any)
    .from('transfers')
    .select('id, status')
    .eq('booking_id', bookingId)
    .in('status', ['pending', 'paid'])
    .maybeSingle()

  if (existingTransfer) {
    return { success: true, alreadyTransferred: true, status: existingTransfer.status }
  }

  const { data: payment } = await (admin as any)
    .from('payments')
    .select('amount_total, platform_fee, currency, status')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment || payment.status !== 'succeeded') {
    return { error: 'payment_not_captured' }
  }

  const { data: traveler } = await admin
    .from('profiles')
    .select('stripe_connect_account_id, stripe_payouts_enabled')
    .eq('id', booking.traveler_id)
    .single()

  if (!traveler?.stripe_connect_account_id || !traveler.stripe_payouts_enabled) {
    await createSystemNotification({
      userId: booking.traveler_id,
      type: 'system_alert',
      title: 'Activez vos paiements',
      content:
        "Ajoutez votre compte bancaire pour recevoir vos gains. L'argent sera débloqué dès que vos paiements sont actifs.",
      bookingId: booking.id,
    })
    return { error: 'payouts_not_enabled' }
  }

  const amountTotal = Number(payment.amount_total ?? 0)
  const platformFee = Number(payment.platform_fee ?? 0)
  const travelerAmount = Math.max(0, amountTotal - platformFee)

  if (travelerAmount <= 0) {
    return { error: 'invalid_transfer_amount' }
  }

  const transfer = await stripe.transfers.create(
    {
      amount: toStripeAmount(travelerAmount),
      currency: (payment.currency || EUR).toLowerCase(),
      destination: traveler.stripe_connect_account_id,
      metadata: {
        booking_id: bookingId,
        reason,
      },
    },
    {
      idempotencyKey: `transfer_${bookingId}`,
    }
  )

  const transferStatus = normalizeTransferStatus(transfer.status)

  await (admin as any).from('transfers').insert({
    booking_id: bookingId,
    stripe_transfer_id: transfer.id,
    amount: travelerAmount,
    currency: (payment.currency || EUR).toLowerCase(),
    status: transferStatus,
    attempted_at: new Date().toISOString(),
  })

  if (transferStatus === 'paid') {
    await admin
      .from('bookings')
      .update({
        payout_at: new Date().toISOString(),
        payout_id: transfer.id,
      })
      .eq('id', bookingId)
  }

  await createSystemNotification({
    userId: booking.traveler_id,
    type: 'payment_confirmed',
    title: 'Paiement débloqué',
    content:
      'Votre paiement sécurisé est en cours de transfert vers votre compte bancaire.',
    bookingId: booking.id,
  })

  return {
    success: true,
    transferId: transfer.id,
    status: transferStatus,
  }
}
