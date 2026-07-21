import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { runAntiCollusionChecks } from '@/lib/trust/anti-collusion'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHENTICATED' },
      { status: 401 }
    )
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return NextResponse.json(
      { error: 'Compte suspendu', code: 'SUSPENDED' },
      { status: 403 }
    )
  }

  const { data: booking } = await admin
    .from('bookings')
    .select('id, sender_id, traveler_id, status, handed_at, status_history')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json(
      { error: 'Réservation introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  // Le voyageur confirme la livraison
  if (booking.traveler_id !== user.id) {
    return NextResponse.json(
      {
        error: 'Seul le voyageur peut confirmer la livraison',
        code: 'FORBIDDEN',
      },
      { status: 403 }
    )
  }

  if (booking.status !== 'handed') {
    return NextResponse.json(
      {
        error: 'Statut incompatible (attendu: handed)',
        code: 'INVALID_STATUS',
      },
      { status: 422 }
    )
  }

  const now = new Date()
  const nowISO = now.toISOString()

  // Calculer la durée depuis la remise
  let durationHours = 0
  if (booking.handed_at) {
    const handedAt = new Date(booking.handed_at)
    durationHours = (now.getTime() - handedAt.getTime()) / (1000 * 60 * 60)
  }

  const historyEntry = {
    status: 'delivered',
    actor_id: user.id,
    timestamp: nowISO,
  }
  const history = Array.isArray(booking.status_history)
    ? booking.status_history
    : []

  const { data: updatedRows, error: updateError } = await admin
    .from('bookings')
    .update({
      status: 'delivered',
      delivered_at: nowISO,
      duration_hours: Math.round(durationHours * 10) / 10,
      status_history: [...history, historyEntry],
    })
    .eq('id', id)
    .eq('status', 'handed')
    .select('id')

  if (updateError || !updatedRows?.length) {
    return NextResponse.json(
      {
        error: 'Statut incompatible (attendu: handed)',
        code: 'INVALID_STATUS',
      },
      { status: 422 }
    )
  }

  // Ouvrir la fenêtre d'avis : créer les entrées pending pour les deux parties
  await admin.from('ratings').upsert(
    [
      {
        booking_id: id,
        rater_id: booking.sender_id,
        rated_id: booking.traveler_id,
        rating: 0,
        status: 'pending',
      },
      {
        booking_id: id,
        rater_id: booking.traveler_id,
        rated_id: booking.sender_id,
        rating: 0,
        status: 'pending',
      },
    ],
    { onConflict: 'booking_id,rater_id', ignoreDuplicates: true }
  )

  // Checks anti-collusion en background
  void runAntiCollusionChecks(id, booking.traveler_id, durationHours)

  return NextResponse.json({ success: true, durationHours })
}
