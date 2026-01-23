/**
 * API Route: Simuler un paiement (sans Stripe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/lib/shared/db/server"
import { calculateBookingAmounts } from "@/lib/core/payments/calculations"
import { getPaymentsMode } from "@/lib/shared/config/features"
import { generateTransportContract } from "@/lib/shared/services/pdf/generation"
import { generateBookingQRCode } from "@/lib/core/bookings/qr-codes"
import { createSystemNotification } from "@/lib/core/notifications/system"

export async function POST(req: NextRequest) {
  if (getPaymentsMode() !== 'simulation') {
    return NextResponse.json(
      { error: 'Mode simulation indisponible' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

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

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      sender_id,
      traveler_id,
      status,
      paid_at,
      kilos_requested,
      price_per_kg,
      package_value,
      insurance_opted,
      announcement_id
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

  if (booking.sender_id !== user.id) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      { status: 403 }
    )
  }

  if (booking.paid_at || booking.status === 'paid') {
    return NextResponse.json({ success: true, alreadyPaid: true })
  }

  if (booking.status !== 'accepted') {
    return NextResponse.json(
      { error: 'Réservation non éligible au paiement' },
      { status: 400 }
    )
  }

  const amounts = calculateBookingAmounts(
    booking.kilos_requested || 0,
    booking.price_per_kg || 0,
    booking.package_value || 0,
    booking.insurance_opted || false
  )

  const paymentIntentId = `sim_${booking.id}`

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_intent_id: paymentIntentId,
    })
    .eq('id', booking_id)

  if (updateError) {
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du paiement' },
      { status: 500 }
    )
  }

  const { error: transactionError } = await (supabase as any)
    .from('transactions')
    .insert({
      booking_id,
      user_id: booking.sender_id,
      type: 'payment',
      amount: amounts.totalAmount,
      currency: 'eur',
      status: 'completed',
      stripe_payment_intent_id: paymentIntentId,
      metadata: {
        commission_amount: amounts.commissionAmount,
        protection_amount: amounts.insurancePremium,
      },
    })

  if (transactionError) {
    console.error('Transaction creation failed:', transactionError)
  }

  try {
    const travelerNotification = await createSystemNotification({
      userId: booking.traveler_id,
      type: 'payment_confirmed',
      title: 'Paiement reçu',
      content: `Paiement de ${amounts.totalAmount.toFixed(2)}€ reçu. Les fonds seront versés après la livraison confirmée.`,
      bookingId: booking_id,
      announcementId: booking.announcement_id,
    })

    const senderNotification = await createSystemNotification({
      userId: booking.sender_id,
      type: 'payment_confirmed',
      title: 'Paiement confirmé',
      content:
        'Votre paiement a été confirmé. Vous pouvez maintenant voir le contrat de transport et le QR code.',
      bookingId: booking_id,
      announcementId: booking.announcement_id,
    })

    if (travelerNotification.error || senderNotification.error) {
      console.error('Notification creation failed (non-blocking):', {
        traveler: travelerNotification.error,
        sender: senderNotification.error,
      })
    }
  } catch (notifError) {
    console.error('Notification creation failed (non-blocking):', notifError)
  }

  try {
    await generateBookingQRCode(booking_id)
  } catch (qrError) {
    console.error('QR code generation failed (non-blocking):', qrError)
  }

  try {
    await generateTransportContract(booking_id)
  } catch (pdfError) {
    console.error('Contract generation failed (non-blocking):', pdfError)
  }

  return NextResponse.json({
    success: true,
    paidAt: new Date().toISOString(),
  })
}
