import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'

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
    .select('id, sender_id, traveler_id, status, status_history')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Réservation introuvable', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Seul le sender confirme la remise du colis au voyageur
  if (booking.sender_id !== user.id) {
    return NextResponse.json({ error: 'Seul l\'expéditeur peut confirmer la remise', code: 'FORBIDDEN' }, { status: 403 })
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Statut incompatible (attendu: confirmed)', code: 'INVALID_STATUS' }, { status: 422 })
  }

  const now = new Date().toISOString()
  const historyEntry = { status: 'handed', actor_id: user.id, timestamp: now }
  const history = Array.isArray(booking.status_history) ? booking.status_history : []

  await admin
    .from('bookings')
    .update({
      status: 'handed',
      handed_at: now,
      status_history: [...history, historyEntry],
    })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
