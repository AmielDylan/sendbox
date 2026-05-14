import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/db/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: profile, error } = await admin
    .from('profiles')
    .select(
      `
      id,
      firstname,
      lastname,
      avatar_url,
      bio,
      trust_score,
      completed_count,
      disputed_count,
      unique_sender_count,
      unique_traveler_count,
      verification_status,
      created_at,
      role
    `
    )
    .eq('id', id)
    .eq('is_suspended', false)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Profil introuvable', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Masquer les profils admin des vues publiques
  if ((profile as any).role === 'admin') {
    return NextResponse.json({ error: 'Profil non disponible', code: 'NOT_FOUND' }, { status: 404 })
  }

  // Récupérer les avis publiés (ne jamais exposer email, phone, kyc_*, is_flagged)
  const { data: ratings } = await admin
    .from('ratings')
    .select(
      `
      rating,
      comment,
      published_at,
      rater:profiles!rater_id(firstname, lastname, avatar_url)
    `
    )
    .eq('rated_id', id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  // Récupérer les trajets complétés (sans données sensibles)
  const { data: bookingsAsTraveler } = await admin
    .from('bookings')
    .select(
      `
      id,
      status,
      completed_at,
      announcement:announcements(
        departure_country,
        departure_city,
        arrival_country,
        arrival_city
      )
    `
    )
    .eq('traveler_id', id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5)

  const { data: bookingsAsSender } = await admin
    .from('bookings')
    .select(
      `
      id,
      status,
      completed_at,
      announcement:announcements(
        departure_country,
        departure_city,
        arrival_country,
        arrival_city
      )
    `
    )
    .eq('sender_id', id)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5)

  // Disputes publiques uniquement
  const { data: disputes } = await admin
    .from('disputes')
    .select('id, reason, status, created_at')
    .or(`booking_id.in.(${
      [...(bookingsAsTraveler ?? []), ...(bookingsAsSender ?? [])].map(b => `"${b.id}"`).join(',') || '""'
    })`)
    .eq('is_public', true)
    .limit(5)

  // Ne jamais exposer : email, phone, kyc_*, is_flagged, données financières, role
  const publicProfile = {
    id: profile.id,
    firstname: profile.firstname,
    lastname: profile.lastname,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    trustScore: profile.trust_score ?? 0,
    completedCount: profile.completed_count ?? 0,
    disputedCount: profile.disputed_count ?? 0,
    uniqueSenderCount: profile.unique_sender_count ?? 0,
    uniqueTravelerCount: profile.unique_traveler_count ?? 0,
    verificationStatus: profile.verification_status ?? 'none',
    memberSince: profile.created_at,
    ratings: ratings ?? [],
    bookingsAsTraveler: bookingsAsTraveler ?? [],
    bookingsAsSender: bookingsAsSender ?? [],
    disputes: disputes ?? [],
  }

  return NextResponse.json(publicProfile)
}
