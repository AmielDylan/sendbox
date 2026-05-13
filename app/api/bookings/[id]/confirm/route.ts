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
    return NextResponse.json({ error: 'Non authentifié', code: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return NextResponse.json({ error: 'Compte suspendu', code: 'SUSPENDED' }, { status: 403 })
  }

  const { data: booking } = await admin
    .from('bookings')
    .select('id, sender_id, traveler_id, status, sender_confirmed_at, traveler_confirmed_at, status_history')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable', code: 'NOT_FOUND' }, { status: 404 })
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  if (!isSender && !isTraveler) {
    return NextResponse.json({ error: 'Accès non autorisé', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (!['accepted', 'paid', 'matched'].includes(booking.status)) {
    return NextResponse.json({ error: 'Statut incompatible', code: 'INVALID_STATUS' }, { status: 422 })
  }

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = {}

  if (isSender && !booking.sender_confirmed_at) {
    updates.sender_confirmed_at = now
  } else if (isTraveler && !booking.traveler_confirmed_at) {
    updates.traveler_confirmed_at = now
  } else {
    return NextResponse.json({ error: 'Déjà confirmé', code: 'ALREADY_CONFIRMED' }, { status: 409 })
  }

  const senderConfirmed = isSender ? true : Boolean(booking.sender_confirmed_at)
  const travelerConfirmed = isTraveler ? true : Boolean(booking.traveler_confirmed_at)

  const historyEntry = { status: 'confirmed', actor_id: user.id, timestamp: now }
  const history = Array.isArray(booking.status_history) ? booking.status_history : []

  if (senderConfirmed && travelerConfirmed) {
    updates.status = 'confirmed'
    updates.status_history = [...history, historyEntry]
  }

  await admin.from('bookings').update(updates).eq('id', id)

  if (senderConfirmed && travelerConfirmed) {
    // Anti-collusion en background — ne pas bloquer la réponse
    void (async () => {
      const { data: fullBooking } = await admin
        .from('bookings')
        .select('traveler_id, duration_hours')
        .eq('id', id)
        .single()
      if (fullBooking) {
        await runAntiCollusionChecks(id, fullBooking.traveler_id, fullBooking.duration_hours ?? 0)
      }
    })()
  }

  return NextResponse.json({ success: true })
}
