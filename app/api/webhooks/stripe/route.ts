/**
 * Webhook Stripe pour gérer les événements de paiement et d'identité
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  stripe,
  STRIPE_WEBHOOK_SECRET,
} from '@/lib/shared/services/stripe/config'
import { createAdminClient } from '@/lib/shared/db/admin'
import { fromStripeAmount } from '@/lib/core/payments/calculations'
import { generateTransportContract } from '@/lib/shared/services/pdf/generation'
import { generateBookingQRCode } from '@/lib/core/bookings/qr-codes'
import { sendEmail } from '@/lib/shared/services/email/client'
import Stripe from 'stripe'
import { getPaymentsMode } from '@/lib/shared/config/features'
import { createSystemNotification } from '@/lib/core/notifications/system'
import type { Database } from '@/types/database.types'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json(
      { error: 'Service role not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('🔔 Stripe webhook received:', {
    id: event.id,
    type: event.type,
    livemode: event.livemode,
  })

  const supabase = createAdminClient()
  const paymentsEnabled = getPaymentsMode() === 'stripe'

  const normalizeTransferStatus = (eventType?: string | null) => {
    switch (eventType) {
      case 'transfer.reversed':
        return 'reversed'
      case 'transfer.created':
      case 'transfer.updated':
        return 'paid'
      default:
        return 'pending'
    }
  }

  const withIdentityMetadata = (
    updateData: Record<string, unknown>,
    session: Stripe.Identity.VerificationSession
  ) => {
    const documentType = session.metadata?.document_type
    if (documentType) {
      updateData.kyc_document_type = documentType
    }
    const documentCountry = session.metadata?.document_country
    if (documentCountry) {
      updateData.kyc_nationality = documentCountry
    }
    return updateData
  }

  type KycStatus = 'pending' | 'approved' | 'rejected' | 'incomplete'

  const notifyKycStatusChange = async (
    userId: string,
    status: KycStatus,
    rejectionReason?: string | null
  ) => {
    const titleMap: Record<KycStatus, string> = {
      pending: 'Vérification en cours',
      approved: 'Identité vérifiée',
      rejected: 'Vérification refusée',
      incomplete: 'Vérification à compléter',
    }

    const contentMap: Record<KycStatus, string> = {
      pending:
        "Votre vérification d'identité est en cours de traitement. Vous serez notifié dès qu'elle sera terminée.",
      approved:
        'Votre identité a été vérifiée avec succès. Toutes les actions sont désormais débloquées.',
      rejected: rejectionReason
        ? `Votre vérification a été refusée : ${rejectionReason}. Vous pouvez soumettre de nouveaux documents.`
        : 'Votre vérification a été refusée. Vous pouvez soumettre de nouveaux documents.',
      incomplete:
        "Votre vérification d'identité n'a pas été finalisée. Veuillez relancer la procédure.",
    }

    try {
      const { error } = await createSystemNotification({
        userId,
        type: 'system_alert',
        title: titleMap[status],
        content: contentMap[status],
      })

      if (error) {
        console.error(
          '❌ KYC notification creation failed (non-blocking):',
          error
        )
      }
    } catch (notifError) {
      console.error(
        '❌ KYC notification creation failed (non-blocking):',
        notifError
      )
    }
  }

  const updateKycProfile = async (
    userId: string | null | undefined,
    updateData: Record<string, unknown>,
    session: Stripe.Identity.VerificationSession
  ) => {
    let updatedRow: { id?: string } | null = null

    if (userId) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('id')

      if (error) {
        console.error('❌ Failed to update profile by user_id:', error)
      } else if (data && data.length > 0) {
        updatedRow = data[0]
      }
    }

    if (!updatedRow) {
      const accountId = session.metadata?.stripe_account_id
      if (accountId) {
        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('stripe_connect_account_id', accountId)
          .select('id')

        if (error) {
          console.error(
            '❌ Failed to update profile by stripe_connect_account_id:',
            error
          )
        } else if (data && data.length > 0) {
          updatedRow = data[0]
        }
      }
    }

    if (!updatedRow) {
      console.error(
        '❌ Unable to update profile for verification session:',
        session.id
      )
    }

    return updatedRow
  }

  try {
    switch (event.type) {
      case 'identity.verification_session.processing': {
        const verificationSession = event.data
          .object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.warn('⚠️ Missing user_id in verification session metadata')
        }

        const receivedAt = new Date().toISOString()
        const updateData = withIdentityMetadata(
          {
            kyc_status: 'pending',
            kyc_submitted_at: receivedAt,
            kyc_rejection_reason: null,
          },
          verificationSession
        )

        const updated = await updateKycProfile(
          userId,
          updateData,
          verificationSession
        )

        const targetUserId = updated?.id || userId
        if (targetUserId) {
          await notifyKycStatusChange(targetUserId, 'pending')
        }
        break
      }

      case 'identity.verification_session.verified': {
        const verificationSession = event.data
          .object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.warn('⚠️ Missing user_id in verification session metadata')
        }

        const receivedAt = new Date().toISOString()
        const updateData = withIdentityMetadata(
          {
            kyc_status: 'approved',
            kyc_reviewed_at: receivedAt,
            kyc_rejection_reason: null,
          },
          verificationSession
        )

        const updated = await updateKycProfile(
          userId,
          updateData,
          verificationSession
        )

        const targetUserId = updated?.id || userId
        if (targetUserId) {
          console.log('✅ KYC approved for user:', userId)
          await notifyKycStatusChange(targetUserId, 'approved')
        }
        break
      }

      case 'identity.verification_session.requires_input': {
        const verificationSession = event.data
          .object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.warn('⚠️ Missing user_id in verification session metadata')
        }

        const rejectionReason =
          verificationSession.last_error?.reason ||
          verificationSession.last_error?.code ||
          'verification_failed'

        const receivedAt = new Date().toISOString()
        const updateData = withIdentityMetadata(
          {
            kyc_status: 'rejected',
            kyc_reviewed_at: receivedAt,
            kyc_rejection_reason: rejectionReason,
          },
          verificationSession
        )

        const updated = await updateKycProfile(
          userId,
          updateData,
          verificationSession
        )

        const targetUserId = updated?.id || userId
        if (targetUserId) {
          await notifyKycStatusChange(targetUserId, 'rejected', rejectionReason)
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        const payoutsEnabled = Boolean(account.payouts_enabled)
        const requirements = account.requirements || null
        const requirementsJson = requirements
          ? (JSON.parse(JSON.stringify(requirements)) as Database['public']['Tables']['profiles']['Row']['stripe_requirements'])
          : null
        const onboardingCompleted =
          payoutsEnabled &&
          !requirements?.currently_due?.length &&
          !requirements?.past_due?.length
        const { data: profile } = await supabase
          .from('profiles')
          .select(
            'id, payout_method, stripe_payouts_enabled, kyc_status, kyc_reviewed_at, kyc_submitted_at'
          )
          .eq('stripe_connect_account_id', account.id)
          .maybeSingle()

        const payoutMethod = (profile as any)?.payout_method as
          | 'stripe_bank'
          | 'mobile_wallet'
          | undefined
        const shouldUpdatePayoutMethod = payoutMethod !== 'mobile_wallet'
        const nextPayoutStatus = payoutsEnabled ? 'active' : 'pending'
        const updatePayload: Record<string, any> = {
          stripe_payouts_enabled: payoutsEnabled,
          stripe_onboarding_completed: onboardingCompleted,
          stripe_requirements: requirementsJson,
        }

        const individualVerificationStatus =
          account.individual?.verification?.status
        const isIdentityVerified =
          individualVerificationStatus === 'verified'

        if (isIdentityVerified) {
          const reviewedAt = new Date().toISOString()
          updatePayload.kyc_status = 'approved'
          updatePayload.kyc_reviewed_at = profile?.kyc_reviewed_at || reviewedAt
          if (!profile?.kyc_submitted_at) {
            updatePayload.kyc_submitted_at = reviewedAt
          }
          updatePayload.kyc_rejection_reason = null
        }

        if (shouldUpdatePayoutMethod) {
          updatePayload.payout_method = payoutMethod || 'stripe_bank'
          updatePayload.payout_status = nextPayoutStatus
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload as any)
          .eq('stripe_connect_account_id', account.id)

        if (error) {
          console.error('❌ Failed to update connect status:', error)
        } else {
          if (isIdentityVerified && profile?.id && profile?.kyc_status !== 'approved') {
            await notifyKycStatusChange(profile.id, 'approved')
          }

          if (
            payoutsEnabled &&
            profile?.id &&
            !profile?.stripe_payouts_enabled
          ) {
            await createSystemNotification({
              userId: profile.id,
              type: 'system_alert',
              title: 'Paiements activés',
              content:
                'Votre compte bancaire est vérifié. Les virements sont maintenant disponibles.',
            })
          }
        }
        break
      }

      case 'identity.verification_session.canceled': {
        const verificationSession = event.data
          .object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.warn('⚠️ Missing user_id in verification session metadata')
        }

        const receivedAt = new Date().toISOString()
        const updateData = withIdentityMetadata(
          {
            kyc_status: 'incomplete',
            kyc_reviewed_at: receivedAt,
            kyc_rejection_reason: 'verification_canceled',
          },
          verificationSession
        )

        const updated = await updateKycProfile(
          userId,
          updateData,
          verificationSession
        )

        const targetUserId = updated?.id || userId
        if (targetUserId) {
          await notifyKycStatusChange(
            targetUserId,
            'incomplete',
            'verification_canceled'
          )
        }
        break
      }

      case 'identity.verification_session.redacted': {
        const verificationSession = event.data
          .object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.warn('⚠️ Missing user_id in verification session metadata')
        }

        const receivedAt = new Date().toISOString()
        const updateData = withIdentityMetadata(
          {
            kyc_status: 'incomplete',
            kyc_reviewed_at: receivedAt,
            kyc_rejection_reason: 'verification_redacted',
          },
          verificationSession
        )

        const updated = await updateKycProfile(
          userId,
          updateData,
          verificationSession
        )

        const targetUserId = updated?.id || userId
        if (targetUserId) {
          await notifyKycStatusChange(
            targetUserId,
            'incomplete',
            'verification_redacted'
          )
        }
        break
      }

      case 'payment_intent.succeeded': {
        if (!paymentsEnabled) {
          console.log('Stripe payments disabled, skipping payment events')
          break
        }
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const booking_id = paymentIntent.metadata.booking_id

        console.log('🔔 Webhook payment_intent.succeeded received:', {
          booking_id,
          payment_intent_id: paymentIntent.id,
          amount: paymentIntent.amount,
        })

        if (!booking_id) {
          console.error('❌ Missing booking_id in payment intent metadata')
          break
        }

        // Vérifier que le booking existe et n'est pas déjà payé (idempotency)
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('id, paid_at, qr_code, status, commission_amount, insurance_premium')
          .eq('id', booking_id)
          .single()

        if (bookingError || !booking) {
          console.error('❌ Booking not found:', booking_id, bookingError)
          break
        }

        console.log('📦 Booking found:', {
          id: booking.id,
          status: booking.status,
          paid_at: booking.paid_at,
          has_qr: !!booking.qr_code,
        })

        const platformFee =
          (booking.commission_amount || 0) + (booking.insurance_premium || 0)

        // Mettre à jour la table payments (idempotent)
        await (supabase as any).from('payments').upsert(
          {
            booking_id,
            stripe_payment_intent_id: paymentIntent.id,
            amount_total: fromStripeAmount(paymentIntent.amount),
            platform_fee: platformFee,
            currency: paymentIntent.currency || 'eur',
            status: 'succeeded',
            captured_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        // Vérifier que le booking n'est pas déjà payé (idempotency)
        if (booking.paid_at) {
          console.log('⏭️  Booking already paid, skipping:', booking_id)
          break
        }

        // Mettre à jour le booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id,
          })
          .eq('id', booking_id)

        if (updateError) {
          console.error('❌ Failed to update booking:', updateError)
          throw updateError
        }

        console.log('✅ Booking updated to paid')

        // Générer le QR code seulement s'il n'existe pas (le trigger le crée normalement)
        if (!booking.qr_code) {
          try {
            const qrCode = await generateBookingQRCode(booking_id)
            console.log('✅ QR code generated:', qrCode)
          } catch (error) {
            console.error('❌ Failed to generate QR code:', error)
            // Ne pas bloquer le webhook si la génération du QR échoue
          }
        } else {
          console.log('ℹ️  QR code already exists:', booking.qr_code)
        }

        // Créer la transaction
        const { error: transactionError } = await (supabase as any)
          .from('transactions')
          .insert({
            booking_id,
            user_id: paymentIntent.metadata.sender_id,
            type: 'payment',
            amount: fromStripeAmount(paymentIntent.amount),
            currency: 'eur',
            status: 'completed',
            stripe_payment_intent_id: paymentIntent.id,
            metadata: {
              commission_amount: fromStripeAmount(
                parseInt(paymentIntent.metadata.commission_amount || '0')
              ),
              insurance_amount: fromStripeAmount(
                parseInt(paymentIntent.metadata.insurance_amount || '0')
              ),
            },
          })

        if (transactionError) {
          console.error('❌ Failed to create transaction:', transactionError)
        } else {
          console.log('✅ Transaction created')
        }

        // Récupérer les emails des utilisateurs pour l'envoi d'emails
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', paymentIntent.metadata.sender_id)
          .single()

        const { data: travelerProfile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', paymentIntent.metadata.traveler_id)
          .single()

        const totalAmount = fromStripeAmount(paymentIntent.amount)

        // Créer notifications pour les deux parties (ne pas bloquer si ça échoue)
        try {
          const travelerNotification = await createSystemNotification({
            userId: paymentIntent.metadata.traveler_id,
            type: 'payment_confirmed',
            title: 'Paiement reçu',
            content: `Paiement de ${totalAmount}€ reçu. Les fonds seront versés après la livraison confirmée.`,
            bookingId: booking_id,
          })

          const senderNotification = await createSystemNotification({
            userId: paymentIntent.metadata.sender_id,
            type: 'payment_confirmed',
            title: 'Paiement confirmé',
            content:
              'Votre paiement a été confirmé. Vous pouvez maintenant voir le contrat de transport et le QR code.',
            bookingId: booking_id,
          })

          if (travelerNotification.error || senderNotification.error) {
            console.error('❌ Notification creation failed (non-blocking):', {
              traveler: travelerNotification.error,
              sender: senderNotification.error,
            })
          } else {
            console.log('✅ Notifications sent')
          }
        } catch (notifError) {
          console.error(
            '❌ Notification creation failed (non-blocking):',
            notifError
          )
        }

        // Récupérer le reçu Stripe depuis le dernier charge
        let receiptUrl: string | null = null
        try {
          if (paymentIntent.latest_charge) {
            const chargeId =
              typeof paymentIntent.latest_charge === 'string'
                ? paymentIntent.latest_charge
                : paymentIntent.latest_charge.id
            const charge = await stripe.charges.retrieve(chargeId)
            receiptUrl = charge.receipt_url
          }
        } catch (chargeError) {
          console.error(
            '❌ Failed to retrieve charge for receipt:',
            chargeError
          )
        }

        // Envoyer email avec reçu à l'expéditeur
        if (senderProfile?.email && receiptUrl) {
          try {
            console.log("📧 Envoi email reçu à l'expéditeur:", {
              to: senderProfile.email,
              receiptUrl,
              amount: totalAmount,
            })

            await sendEmail({
              to: senderProfile.email,
              subject: `Paiement confirmé - ${totalAmount}€ - Sendbox`,
              template: 'payment_receipt',
              data: {
                amount: totalAmount,
                receiptUrl,
                booking_id,
              },
            })

            console.log("✅ Email reçu envoyé à l'expéditeur")
          } catch (emailError) {
            console.error(
              '❌ Failed to send receipt email (non-blocking):',
              emailError
            )
          }
        }

        // Envoyer email de notification de paiement au voyageur
        if (travelerProfile?.email) {
          try {
            console.log('📧 Envoi email notification au voyageur:', {
              to: travelerProfile.email,
              amount: totalAmount,
            })

            await sendEmail({
              to: travelerProfile.email,
              subject: `Paiement reçu - ${totalAmount}€ - Sendbox`,
              template: 'payment_received',
              data: {
                amount: totalAmount,
                booking_id,
              },
            })

            console.log('✅ Email notification envoyé au voyageur')
          } catch (emailError) {
            console.error(
              '❌ Failed to send traveler email (non-blocking):',
              emailError
            )
          }
        }

        // Générer contrat de transport PDF
        try {
          await generateTransportContract(booking_id)
          console.log('✅ Transport contract generated')
        } catch (pdfError) {
          console.error(
            '❌ Failed to generate contract (non-blocking):',
            pdfError
          )
        }

        console.log('✅✅✅ Payment succeeded for booking:', booking_id)
        break
      }

      case 'payment_intent.payment_failed': {
        if (!paymentsEnabled) {
          console.log('Stripe payments disabled, skipping payment events')
          break
        }
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const booking_id = paymentIntent.metadata.booking_id

        if (booking_id) {
          await (supabase as any).from('payments').upsert(
            {
              booking_id,
              stripe_payment_intent_id: paymentIntent.id,
              amount_total: fromStripeAmount(paymentIntent.amount),
              platform_fee: fromStripeAmount(
                parseInt(paymentIntent.metadata.platform_fee || '0')
              ),
              currency: paymentIntent.currency || 'eur',
              status: paymentIntent.status,
            },
            { onConflict: 'stripe_payment_intent_id' }
          )

          // Créer une transaction pour l'échec
          await (supabase as any).from('transactions').insert({
            booking_id,
            user_id: paymentIntent.metadata.sender_id,
            type: 'payment',
            amount: fromStripeAmount(paymentIntent.amount),
            currency: 'eur',
            status: 'failed',
            stripe_payment_intent_id: paymentIntent.id,
            metadata: {
              error:
                paymentIntent.last_payment_error?.message || 'Unknown error',
            },
          })

          console.log('Payment failed for booking:', booking_id)
        }
        break
      }

      case 'charge.refunded': {
        if (!paymentsEnabled) {
          console.log('Stripe payments disabled, skipping payment events')
          break
        }
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          const refundStatus =
            charge.amount_refunded &&
            charge.amount_refunded < (charge.amount || 0)
              ? 'partially_refunded'
              : 'refunded'

          await (supabase as any)
            .from('payments')
            .update({ status: refundStatus })
            .eq('stripe_payment_intent_id', paymentIntentId)

          // Récupérer le booking via payment_intent_id
          const { data: booking } = await supabase
            .from('bookings')
            .select('id')
            .eq('payment_intent_id', paymentIntentId)
            .single()

          if (booking) {
            // Créer une transaction de refund
            await (supabase as any).from('transactions').insert({
              booking_id: booking.id,
              user_id: charge.metadata.sender_id || '',
              type: 'refund',
              amount: fromStripeAmount(charge.amount_refunded),
              currency: 'eur',
              status: 'completed',
              stripe_refund_id: charge.refunds?.data[0]?.id || null,
            })

            // Mettre à jour le statut du booking si nécessaire
            await supabase
              .from('bookings')
              .update({ status: 'cancelled' })
              .eq('id', booking.id)

            console.log('Refund processed for booking:', booking.id)
          }
        }
        break
      }

      case 'transfer.created':
      case 'transfer.updated':
      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer
        const bookingId = transfer.metadata?.booking_id

        if (!bookingId) {
          break
        }

        const transferStatus = normalizeTransferStatus(event.type)

        await (supabase as any).from('transfers').upsert(
          {
            booking_id: bookingId,
            stripe_transfer_id: transfer.id,
            amount: fromStripeAmount(transfer.amount),
            currency: transfer.currency || 'eur',
            status: transferStatus,
            attempted_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_transfer_id' }
        )

        if (transferStatus === 'paid') {
          await supabase
            .from('bookings')
            .update({
              payout_at: new Date().toISOString(),
              payout_id: transfer.id,
            })
            .eq('id', bookingId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    )
  }
}
