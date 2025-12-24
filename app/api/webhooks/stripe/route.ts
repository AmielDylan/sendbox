/**
 * Webhook Stripe pour gérer les événements de paiement
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/shared/services/stripe/config"
import { createClient } from "@/lib/shared/db/server"
import { fromStripeAmount } from "@/lib/core/payments/calculations"
import { generateTransportContract } from "@/lib/shared/services/pdf/generation"
import { generateBookingQRCode } from "@/lib/core/bookings/qr-codes"
import Stripe from 'stripe'

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

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const booking_id = paymentIntent.metadata.booking_id

        if (!booking_id) {
          console.error('Missing booking_id in payment intent metadata')
          break
        }

        // Vérifier que le booking existe et n'est pas déjà payé (idempotency)
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('id, paid_at')
          .eq('id', booking_id)
          .single()

        if (bookingError || !booking) {
          console.error('Booking not found:', booking_id)
          break
        }

        // Vérifier que le booking n'est pas déjà payé (idempotency)
        if (booking.paid_at) {
          console.log('Booking already paid, skipping:', booking_id)
          break
        }

        // Mettre à jour le booking
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed', // Passer à 'confirmed' après paiement
            paid_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id,
          })
          .eq('id', booking_id)

        // Générer le QR code pour le booking
        try {
          await generateBookingQRCode(booking_id)
          console.log('QR code generated for booking:', booking_id)
        } catch (error) {
          console.error('Failed to generate QR code:', error)
          // Ne pas bloquer le webhook si la génération du QR échoue
        }

        // Créer la transaction
        await supabase.from('transactions').insert({
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

        // TODO: Créer notification pour le voyageur
        // await supabase.rpc('create_notification', {
        //   p_user_id: paymentIntent.metadata.traveler_id,
        //   p_type: 'payment_confirmed',
        //   p_title: 'Réservation confirmée',
        //   p_content: 'Un expéditeur a réservé de l\'espace sur votre trajet',
        //   p_booking_id: booking_id,
        // })

        // Générer contrat de transport PDF
        await generateTransportContract(booking_id)

        // TODO: Envoyer email de confirmation
        console.log('Payment succeeded for booking:', booking_id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const booking_id = paymentIntent.metadata.booking_id

        if (booking_id) {
          // Créer une transaction pour l'échec
          await supabase.from('transactions').insert({
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
            await supabase.from('transactions').insert({
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

