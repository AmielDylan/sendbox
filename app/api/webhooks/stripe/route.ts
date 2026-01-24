/**
 * Webhook Stripe pour gérer les événements de paiement et d'identité
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/shared/services/stripe/config"
import { createClient } from "@/lib/shared/db/server"
import { fromStripeAmount } from "@/lib/core/payments/calculations"
import { generateTransportContract } from "@/lib/shared/services/pdf/generation"
import { generateBookingQRCode } from "@/lib/core/bookings/qr-codes"
import { sendEmail } from "@/lib/shared/services/email/client"
import Stripe from 'stripe'
import { getPaymentsMode } from '@/lib/shared/config/features'
import { createSystemNotification } from '@/lib/core/notifications/system'

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

  const supabase = await createClient()
  const paymentsEnabled = getPaymentsMode() === 'stripe'

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

  try {
    switch (event.type) {
      case 'identity.verification_session.processing': {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.error('❌ Missing user_id in verification session metadata')
          break
        }

        const updateData = withIdentityMetadata(
          {
            kyc_status: 'pending',
            kyc_submitted_at: new Date().toISOString(),
          },
          verificationSession
        )

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          console.error('❌ Failed to update KYC status (processing):', error)
        }
        break
      }

      case 'identity.verification_session.verified': {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.error('❌ Missing user_id in verification session metadata')
          break
        }

        const updateData = withIdentityMetadata(
          {
            kyc_status: 'approved',
            kyc_reviewed_at: new Date().toISOString(),
            kyc_rejection_reason: null,
          },
          verificationSession
        )

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          console.error('❌ Failed to update KYC status (verified):', error)
        }
        break
      }

      case 'identity.verification_session.requires_input': {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.error('❌ Missing user_id in verification session metadata')
          break
        }

        const rejectionReason =
          verificationSession.last_error?.code ||
          verificationSession.last_error?.reason ||
          'verification_failed'

        const updateData = withIdentityMetadata(
          {
            kyc_status: 'rejected',
            kyc_reviewed_at: new Date().toISOString(),
            kyc_rejection_reason: rejectionReason,
          },
          verificationSession
        )

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          console.error('❌ Failed to update KYC status (requires_input):', error)
        }
        break
      }

      case 'identity.verification_session.canceled': {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession
        const userId = verificationSession.metadata?.user_id

        if (!userId) {
          console.error('❌ Missing user_id in verification session metadata')
          break
        }

        const updateData = withIdentityMetadata(
          {
            kyc_status: 'incomplete',
            kyc_reviewed_at: new Date().toISOString(),
            kyc_rejection_reason: 'verification_canceled',
          },
          verificationSession
        )

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId)

        if (error) {
          console.error('❌ Failed to update KYC status (canceled):', error)
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
          .select('id, paid_at, qr_code, status')
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
          console.error('❌ Notification creation failed (non-blocking):', notifError)
        }

        // Récupérer le reçu Stripe depuis le dernier charge
        let receiptUrl: string | null = null
        try {
          if (paymentIntent.latest_charge) {
            const chargeId = typeof paymentIntent.latest_charge === 'string'
              ? paymentIntent.latest_charge
              : paymentIntent.latest_charge.id
            const charge = await stripe.charges.retrieve(chargeId)
            receiptUrl = charge.receipt_url
          }
        } catch (chargeError) {
          console.error('❌ Failed to retrieve charge for receipt:', chargeError)
        }

        // Envoyer email avec reçu à l'expéditeur
        if (senderProfile?.email && receiptUrl) {
          try {
            console.log('📧 Envoi email reçu à l\'expéditeur:', {
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

            console.log('✅ Email reçu envoyé à l\'expéditeur')
          } catch (emailError) {
            console.error('❌ Failed to send receipt email (non-blocking):', emailError)
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
            console.error('❌ Failed to send traveler email (non-blocking):', emailError)
          }
        }

        // Générer contrat de transport PDF
        try {
          await generateTransportContract(booking_id)
          console.log('✅ Transport contract generated')
        } catch (pdfError) {
          console.error('❌ Failed to generate contract (non-blocking):', pdfError)
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
              error: paymentIntent.last_payment_error?.message || 'Unknown error',
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
