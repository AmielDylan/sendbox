import { stripe } from '@/lib/shared/services/stripe/config'
import { calculateBookingAmounts, toStripeAmount } from '@/lib/core/payments/calculations'
import { COMMISSION_RATE, MAX_INSURANCE_COVERAGE } from '@/lib/core/bookings/validations'
import { isFeatureEnabled } from '@/lib/shared/config/features'

interface CreatePaymentIntentResult {
  clientSecret?: string
  amount?: number
  alreadyPaid?: boolean
  error?: string
  errorDetails?: string
  field?: string
  status?: number
}

export async function createBookingPaymentIntent({
  supabase,
  bookingId,
  userId,
}: {
  supabase: any
  bookingId: string
  userId: string
}): Promise<CreatePaymentIntentResult> {
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
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return { error: 'Réservation introuvable', status: 404 }
  }

  if (booking.sender_id !== userId) {
    return { error: 'Non autorisé', status: 403 }
  }

  if (booking.paid_at || booking.status === 'paid') {
    return { alreadyPaid: true, status: 200 }
  }

  if (booking.status !== 'accepted') {
    return { error: 'Réservation non éligible au paiement', status: 400 }
  }

  if (isFeatureEnabled('KYC_ENABLED')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status, kyc_rejection_reason')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return { error: 'Profil introuvable', status: 404 }
    }

    if (profile.kyc_status !== 'approved') {
      let errorMessage = "Vérification d'identité requise pour continuer"
      let errorDetails =
        "Veuillez compléter votre vérification d'identité pour effectuer un paiement."

      if (profile.kyc_status === 'pending') {
        errorMessage = 'Vérification en cours'
        errorDetails =
          "Votre vérification d'identité est en cours d'examen. Vous pourrez effectuer un paiement une fois celle-ci approuvée (24-48h)."
      } else if (profile.kyc_status === 'rejected') {
        errorMessage = 'Vérification refusée'
        errorDetails = profile.kyc_rejection_reason
          ? `Votre vérification a été refusée : ${profile.kyc_rejection_reason}. Veuillez soumettre de nouveaux documents.`
          : 'Votre vérification a été refusée. Veuillez soumettre de nouveaux documents depuis vos réglages.'
      } else if (profile.kyc_status === 'incomplete') {
        errorMessage = "Vérification d'identité incomplète"
        errorDetails =
          "Veuillez soumettre vos documents d'identité pour effectuer un paiement."
      }

      return {
        error: errorMessage,
        errorDetails,
        field: 'kyc',
        status: 403,
      }
    }
  }

  const announcement = booking.announcements as any

  const amounts = calculateBookingAmounts(
    booking.kilos_requested || 0,
    booking.price_per_kg || announcement?.price_per_kg || 0,
    booking.package_value || 0,
    booking.insurance_opted || false
  )

  const platformFee = amounts.commissionAmount + amounts.insurancePremium
  const insuranceCoverage = Math.min(
    booking.package_value || 0,
    MAX_INSURANCE_COVERAGE
  )

  // Reuse existing intent if present
  if (booking.payment_intent_id) {
    try {
      const existingIntent = await stripe.paymentIntents.retrieve(
        booking.payment_intent_id
      )

      if (existingIntent.status === 'succeeded') {
        return { alreadyPaid: true, status: 200 }
      }

      if (existingIntent.client_secret) {
        await (supabase as any).from('payments').upsert(
          {
            booking_id: booking.id,
            stripe_payment_intent_id: existingIntent.id,
            amount_total: amounts.totalAmount,
            platform_fee: platformFee,
            currency: existingIntent.currency || 'eur',
            status: existingIntent.status,
          },
          { onConflict: 'stripe_payment_intent_id' }
        )

        return {
          clientSecret: existingIntent.client_secret,
          amount: amounts.totalAmount,
        }
      }
    } catch (error) {
      console.warn('Existing payment intent not found:', error)
    }
  }

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: toStripeAmount(amounts.totalAmount),
      currency: 'eur',
      capture_method: 'automatic',
      automatic_payment_methods: { enabled: true },
      metadata: {
        booking_id: booking.id,
        sender_id: booking.sender_id,
        traveler_id: booking.traveler_id || announcement?.traveler_id || '',
        platform_fee: toStripeAmount(platformFee).toString(),
        total_amount: toStripeAmount(amounts.totalAmount).toString(),
      },
      description: `Réservation Sendbox - ${booking.kilos_requested}kg`,
    },
    {
      idempotencyKey: `payment_intent_${booking.id}`,
    }
  )

  await supabase
    .from('bookings')
    .update({
      payment_intent_id: paymentIntent.id,
      total_price: amounts.totalPrice,
      commission_amount: amounts.commissionAmount,
      commission_rate: COMMISSION_RATE,
      insurance_premium: amounts.insurancePremium,
      insurance_coverage: insuranceCoverage,
    })
    .eq('id', bookingId)

  await (supabase as any).from('payments').upsert(
    {
      booking_id: booking.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount_total: amounts.totalAmount,
      platform_fee: platformFee,
      currency: paymentIntent.currency || 'eur',
      status: paymentIntent.status,
    },
    { onConflict: 'stripe_payment_intent_id' }
  )

  return {
    clientSecret: paymentIntent.client_secret || undefined,
    amount: amounts.totalAmount,
  }
}
