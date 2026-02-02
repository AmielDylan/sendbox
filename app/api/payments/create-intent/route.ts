/**
 * API Route: Créer un Payment Intent Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createBookingPaymentIntent } from '@/lib/core/payments/create-payment-intent'
import { getPaymentsMode } from '@/lib/shared/config/features'

export async function POST(req: NextRequest) {
  if (getPaymentsMode() !== 'stripe') {
    return NextResponse.json(
      { error: 'Paiements Stripe indisponibles (mode simulation)' },
      { status: 503 }
    )
  }

  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { booking_id } = await req.json()

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id requis' }, { status: 400 })
    }

    const result = await createBookingPaymentIntent({
      supabase,
      bookingId: booking_id,
      userId: user.id,
    })

    if (result.alreadyPaid) {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error,
          errorDetails: result.errorDetails,
          field: result.field,
        },
        { status: result.status || 400 }
      )
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      amount: result.amount,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}
