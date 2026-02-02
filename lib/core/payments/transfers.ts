/**
 * Stripe Connect transfers (release funds to traveler).
 */

'use server'

import { createAdminClient } from '@/lib/shared/db/admin'
import { stripe } from '@/lib/shared/services/stripe/config'
import { toStripeAmount } from '@/lib/core/payments/calculations'
import { createSystemNotification } from '@/lib/core/notifications/system'
import { getPaymentsMode } from '@/lib/shared/config/features'
import { createFedaPayPayout } from '@/lib/services/fedapay'

const EUR = 'eur'
const XOF = 'xof'

function normalizeTransferStatus(value: string | null | undefined) {
  switch (value) {
    case 'transfer.reversed':
      return 'reversed'
    case 'transfer.created':
    case 'transfer.updated':
      return 'paid'
    case 'paid':
    case 'failed':
    case 'reversed':
    case 'pending':
      return value
    default:
      return 'pending'
  }
}

function normalizeWalletStatus(value: string | null | undefined) {
  switch (value) {
    case 'completed':
    case 'paid':
    case 'sent':
      return 'paid'
    case 'failed':
    case 'canceled':
    case 'cancelled':
      return 'failed'
    case 'scheduled':
    case 'pending':
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
  const paymentsMode = getPaymentsMode()

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
    .select(
      'stripe_connect_account_id, stripe_payouts_enabled, payout_method, payout_status, wallet_operator, wallet_phone, firstname, lastname, email'
    )
    .eq('id', booking.traveler_id)
    .single()

  if (!traveler) {
    return { error: 'traveler_not_found' }
  }

  const payoutMethod = (traveler as any)?.payout_method as
    | 'stripe_bank'
    | 'mobile_wallet'
    | undefined
  const payoutStatus = (traveler as any)?.payout_status as
    | 'pending'
    | 'active'
    | undefined

  const amountTotal = Number(payment.amount_total ?? 0)
  const platformFee = Number(payment.platform_fee ?? 0)
  const travelerAmount = Math.max(0, amountTotal - platformFee)

  if (travelerAmount <= 0) {
    return { error: 'invalid_transfer_amount' }
  }

  if (payoutMethod === 'mobile_wallet') {
    if (payoutStatus !== 'active') {
      await createSystemNotification({
        userId: booking.traveler_id,
        type: 'system_alert',
        title: 'Activez votre Mobile Wallet',
        content:
          'Validez votre numéro Mobile Wallet pour recevoir vos gains.',
        bookingId: booking.id,
      })
      return { error: 'wallet_not_verified' }
    }

    if (!(traveler as any)?.wallet_operator || !(traveler as any)?.wallet_phone) {
      return { error: 'wallet_not_configured' }
    }

    const payoutCurrency = (payment.currency || XOF).toLowerCase()
    if (payoutCurrency !== XOF) {
      return { error: 'wallet_currency_not_supported' }
    }

    const payout = await createFedaPayPayout({
      amount: travelerAmount,
      currency: payoutCurrency.toUpperCase(),
      operator: (traveler as any)?.wallet_operator,
      phoneNumber: (traveler as any)?.wallet_phone,
      receiverName: [traveler?.firstname, traveler?.lastname]
        .filter(Boolean)
        .join(' ')
        .trim(),
      reference: bookingId,
      metadata: {
        booking_id: bookingId,
        reason,
      },
    })

    const transferStatus = normalizeWalletStatus(payout.status)

    await (admin as any).from('transfers').insert({
      booking_id: bookingId,
      stripe_transfer_id: null,
      external_transfer_id: payout.id,
      payout_provider: 'fedapay',
      amount: travelerAmount,
      currency: payoutCurrency,
      status: transferStatus,
      attempted_at: new Date().toISOString(),
    })

    if (transferStatus === 'paid') {
      await admin
        .from('bookings')
        .update({
          payout_at: new Date().toISOString(),
          payout_id: payout.id,
        })
        .eq('id', bookingId)
    }

    await createSystemNotification({
      userId: booking.traveler_id,
      type: 'payment_confirmed',
      title: 'Paiement débloqué',
      content:
        'Votre paiement sécurisé est en cours de transfert vers votre Mobile Wallet.',
      bookingId: booking.id,
    })

    return {
      success: true,
      transferId: payout.id,
      status: transferStatus,
    }
  }

  if (paymentsMode !== 'stripe') {
    return { skipped: true, error: 'payments_disabled' }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: 'stripe_not_configured' }
  }

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

  const transferStatus = normalizeTransferStatus('transfer.created')

  await (admin as any).from('transfers').insert({
    booking_id: bookingId,
    stripe_transfer_id: transfer.id,
    external_transfer_id: transfer.id,
    payout_provider: 'stripe',
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
