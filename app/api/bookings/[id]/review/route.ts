import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/db/server'
import { createAdminClient } from '@/lib/shared/db/admin'
import { tryPublishBlindReviews } from '@/lib/trust/score'
import {
  filterReviewCriteriaForRole,
  formatReviewComment,
  ratingSchema,
  type ReviewRole,
} from '@/lib/core/ratings/validations'

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
    return NextResponse.json(
      { error: 'Non authentifie', code: 'UNAUTHENTICATED' },
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
    .select('id, sender_id, traveler_id, status')
    .eq('id', id)
    .single()

  if (!booking) {
    return NextResponse.json(
      { error: 'Reservation introuvable', code: 'NOT_FOUND' },
      { status: 404 }
    )
  }

  const isSender = booking.sender_id === user.id
  const isTraveler = booking.traveler_id === user.id

  if (!isSender && !isTraveler) {
    return NextResponse.json(
      { error: 'Acces non autorise', code: 'FORBIDDEN' },
      { status: 403 }
    )
  }

  if (!['delivered', 'completed'].includes(booking.status)) {
    return NextResponse.json(
      {
        error: 'La livraison doit etre confirmee avant de noter',
        code: 'INVALID_STATUS',
      },
      { status: 422 }
    )
  }

  const { data: existing } = await admin
    .from('ratings')
    .select('id, status')
    .eq('booking_id', id)
    .eq('rater_id', user.id)
    .maybeSingle()

  if (existing?.status === 'published') {
    return NextResponse.json(
      { error: 'Avis deja publie', code: 'REVIEW_IMMUTABLE' },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Corps de requete invalide', code: 'BAD_REQUEST' },
      { status: 400 }
    )
  }

  const validation = ratingSchema.safeParse({
    ...(body as Record<string, unknown>),
    booking_id: id,
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Avis invalide',
        code: 'INVALID_REVIEW',
        fieldErrors: validation.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { rating, comment, criteria } = validation.data
  const reviewerRole: ReviewRole = isSender ? 'sender' : 'traveler'
  const allowedCriteria = filterReviewCriteriaForRole(criteria, reviewerRole)

  if (allowedCriteria.length === 0) {
    return NextResponse.json(
      {
        error: 'Selectionnez au moins un critere adapte a votre role',
        code: 'INVALID_REVIEW_CRITERIA',
      },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const ratedId = isSender ? booking.traveler_id : booking.sender_id
  const formattedComment = formatReviewComment(comment, allowedCriteria)

  if (existing) {
    await admin
      .from('ratings')
      .update({
        rating,
        comment: formattedComment,
        status: 'submitted',
        submitted_at: now,
      })
      .eq('id', existing.id)
  } else {
    await admin.from('ratings').insert({
      booking_id: id,
      rater_id: user.id,
      rated_id: ratedId,
      rating,
      comment: formattedComment,
      status: 'submitted',
      submitted_at: now,
    })
  }

  await tryPublishBlindReviews(id)

  return NextResponse.json({ success: true })
}
