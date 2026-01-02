/**
 * API Route: Créer un Payment Intent Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/lib/shared/db/server"
import { stripe } from "@/lib/shared/services/stripe/config"
import { calculateBookingAmounts, toStripeAmount } from "@/lib/core/payments/calculations"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { booking_id } = await req.json()

    if (!booking_id) {
      return NextResponse.json(
        { error: 'booking_id requis' },
        { status: 400 }
      )
    }

    // Récupérer le booking avec l'annonce
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        *,
        announcements:announcement_id (
          traveler_id,
          price_per_kg
        )
      `
      )
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      )
    }

    // Vérifier que le booking appartient à l'utilisateur
    if (booking.sender_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      )
    }

    // Vérifier que le booking n'est pas déjà payé
    if (booking.payment_intent_id) {
      return NextResponse.json(
        { error: 'Cette réservation est déjà payée' },
        { status: 400 }
      )
    }

    const announcement = booking.announcements as any

    // Calculer les montants
    const amounts = calculateBookingAmounts(
      (booking.kilos_requested || booking.weight_kg) || 0,
      announcement.price_per_kg,
      booking.package_value || 0,
      booking.insurance_opted || false
    )

    // Mettre à jour le booking avec les montants calculés
    await supabase
      .from('bookings')
      .update({
        total_price: amounts.totalPrice,
        commission_amount: amounts.commissionAmount,
        insurance_premium: amounts.insurancePremium,
      })
      .eq('id', booking_id)

    // Créer le Payment Intent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: toStripeAmount(amounts.totalAmount),
      currency: 'eur',
      metadata: {
        booking_id: booking.id,
        sender_id: booking.sender_id,
        traveler_id: announcement.traveler_id,
        commission_amount: toStripeAmount(amounts.commissionAmount).toString(),
        insurance_amount: toStripeAmount(amounts.insurancePremium).toString(),
        total_price: toStripeAmount(amounts.totalPrice).toString(),
      },
      // Application fee (commission Sendbox) - pour Stripe Connect
      // Note: En mode escrow, les fonds sont bloqués jusqu'à confirmation
      application_fee_amount: toStripeAmount(amounts.commissionAmount),
      // Description pour le client
      description: `Réservation Sendbox - ${(booking.kilos_requested || booking.weight_kg)}kg`,
    })

    // Sauvegarder le payment_intent_id dans le booking
    await supabase
      .from('bookings')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', booking_id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amounts.totalAmount,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}











