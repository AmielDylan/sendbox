import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { tryPublishBlindReviews } from '@/lib/trust/score'

export async function POST(
  req: NextRequest,
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
    .select('id, sender_id, traveler_id, status')
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

  if (!['delivered', 'completed'].includes(booking.status)) {
    return NextResponse.json({ error: 'La livraison doit être confirmée avant de noter', code: 'INVALID_STATUS' }, { status: 422 })
  }

  // RÈGLE D'IMMUTABILITÉ : un avis publié ne peut jamais être modifié
  const { data: existing } = await admin
    .from('ratings')
    .select('id, status')
    .eq('booking_id', id)
    .eq('rater_id', user.id)
    .maybeSingle()

  if (existing?.status === 'published') {
    return NextResponse.json({ error: 'Avis déjà publié', code: 'REVIEW_IMMUTABLE' }, { status: 403 })
  }

  let body: { rating: number; comment?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide', code: 'BAD_REQUEST' }, { status: 400 })
  }

  const { rating, comment } = body

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Note invalide (1 à 5)', code: 'INVALID_RATING' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const ratedId = isSender ? booking.traveler_id : booking.sender_id

  if (existing) {
    // Mettre à jour l'avis existant (pending → submitted)
    await admin
      .from('ratings')
      .update({ rating, comment: comment ?? null, status: 'submitted', submitted_at: now })
      .eq('id', existing.id)
  } else {
    // Insérer un nouvel avis
    await admin.from('ratings').insert({
      booking_id: id,
      rater_id: user.id,
      rated_id: ratedId,
      rating,
      comment: comment ?? null,
      status: 'submitted',
      submitted_at: now,
    })
  }

  // Tenter la publication simultanée en aveugle
  await tryPublishBlindReviews(id)

  return NextResponse.json({ success: true })
}
